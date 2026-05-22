const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

async function callAI(userPrompt, systemPrompt = '') {
  if (!process.env.OPENROUTER_API_KEY) {
    const err = new Error('AI service not configured (missing OPENROUTER_API_KEY)');
    err.statusCode = 503;
    throw err;
  }
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'DiscoverAI'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userPrompt }
      ]
    })
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || 'AI unavailable';
}

async function logActivity(req, action, entity_type, entity_id, details) {
  try {
    await pool.query(
      'INSERT INTO activity_log (user_id, user_email, action, entity_type, entity_id, details) VALUES ($1,$2,$3,$4,$5,$6)',
      [req.user?.id || null, req.user?.email || null, action, entity_type || null, entity_id || null, details || null]
    );
  } catch (e) { /* best-effort, ignore if table missing */ }
}

function aiError(res, err) {
  if (err && err.statusCode === 503) return res.status(503).json({ error: err.message });
  return res.status(500).json({ error: err.message || 'AI request failed' });
}

router.post('/generate-hypothesis', async (req, res) => {
  try {
    const { project_id, domain, prior_results } = req.body;
    let projectInfo = '';
    if (project_id) {
      const pr = await pool.query('SELECT * FROM projects WHERE id = $1', [project_id]);
      if (pr.rows.length > 0) {
        const p = pr.rows[0];
        projectInfo = `Project: ${p.name}\nDomain: ${p.domain}\nGoal: ${p.goal}\nIterations: ${p.iteration_count}\nBreakthroughs: ${p.breakthrough_count}`;
      }
    }
    const prompt = `Generate a novel scientific hypothesis for a research project.

${projectInfo}
Domain: ${domain || 'general science'}

Prior Results:
${JSON.stringify(prior_results || [], null, 2)}

Generate a compelling, testable hypothesis including:
1. **Hypothesis Statement** - Clear, falsifiable hypothesis
2. **Scientific Rationale** - Why this hypothesis is plausible based on existing knowledge
3. **Key Variables** - Independent, dependent, and controlled variables
4. **Predicted Outcomes** - What we expect to observe if the hypothesis is correct
5. **Alternative Hypotheses** - 2-3 competing explanations to consider
6. **Novelty Assessment** - What makes this hypothesis innovative
7. **Feasibility Score** - Estimated feasibility (1-10) with reasoning
8. **Potential Impact** - Scientific and practical implications if validated`;

    const result = await callAI(prompt, 'You are a world-class scientist and AI researcher specializing in generating novel, testable hypotheses. You think creatively while maintaining scientific rigor.');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/design-experiment', async (req, res) => {
  try {
    const { hypothesis, domain } = req.body;
    const prompt = `Design a rigorous experiment to test this scientific hypothesis.

Hypothesis: ${hypothesis || 'Unknown hypothesis'}
Domain: ${domain || 'general science'}

Design a comprehensive experiment including:
1. **Experimental Design** - Type of study (RCT, observational, computational, etc.)
2. **Materials & Methods** - Detailed experimental protocol
3. **Sample Size & Power** - Statistical considerations
4. **Controls** - Positive and negative controls required
5. **Data Collection** - What measurements to take and when
6. **Analysis Plan** - Statistical methods to analyze results
7. **Timeline** - Realistic timeline with milestones
8. **Resource Requirements** - Equipment, personnel, budget estimate
9. **Risk Mitigation** - Potential pitfalls and how to address them
10. **Success Criteria** - How to determine if hypothesis is supported or rejected`;

    const result = await callAI(prompt, 'You are an expert experimental design specialist with expertise across multiple scientific domains. You design rigorous, efficient experiments that maximize information gain.');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/analyze-results', async (req, res) => {
  try {
    const { result_data, hypothesis } = req.body;
    const prompt = `Analyze scientific experiment results and determine their significance and implications.

Hypothesis being tested: ${hypothesis || 'Not specified'}

Result Data:
${JSON.stringify(result_data || {}, null, 2)}

Provide comprehensive analysis:
1. **Statistical Significance** - Is the result statistically significant? What does it mean?
2. **Effect Size** - Practical vs statistical significance
3. **Hypothesis Evaluation** - Does this support, refute, or remain inconclusive about the hypothesis?
4. **Alternative Explanations** - Other explanations for the observed results
5. **Confounding Factors** - Potential confounders that may have affected results
6. **Reproducibility** - How confident are we in the result's reproducibility?
7. **Scientific Implications** - What does this mean for the field?
8. **Next Steps** - What experiments should follow?
9. **Publication Worthiness** - Is this result worth publishing and in which journal?
10. **Breakthrough Assessment** - Does this qualify as a breakthrough discovery?`;

    const result = await callAI(prompt, 'You are a senior biostatistician and scientific reviewer with expertise in interpreting experimental results across multiple disciplines.');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/discovery-report', async (req, res) => {
  try {
    const { project_id } = req.body;
    let projectData = {};
    if (project_id) {
      const [projRes, hypRes, expRes, resRes, pubRes] = await Promise.all([
        pool.query('SELECT * FROM projects WHERE id = $1', [project_id]),
        pool.query('SELECT * FROM hypotheses WHERE project_id = $1 ORDER BY created_at DESC LIMIT 5', [project_id]),
        pool.query('SELECT e.* FROM experiments e JOIN hypotheses h ON e.hypothesis_id = h.id WHERE h.project_id = $1 ORDER BY e.started_at DESC NULLS LAST LIMIT 5', [project_id]),
        pool.query('SELECT r.* FROM results r JOIN experiments e ON r.experiment_id = e.id JOIN hypotheses h ON e.hypothesis_id = h.id WHERE h.project_id = $1 ORDER BY r.id DESC LIMIT 5', [project_id]),
        pool.query('SELECT * FROM publications WHERE project_id = $1', [project_id])
      ]);
      projectData = {
        project: projRes.rows[0],
        hypotheses: hypRes.rows,
        experiments: expRes.rows,
        results: resRes.rows,
        publications: pubRes.rows
      };
    }
    const prompt = `Generate a comprehensive discovery loop progress report for a scientific research project.

Project Data:
${JSON.stringify(projectData, null, 2)}

Generate a detailed report including:
1. **Executive Summary** - Current state of discovery progress
2. **Hypothesis Pipeline** - Active, validated, and rejected hypotheses
3. **Experiment Status** - Running, completed, and planned experiments
4. **Key Findings** - Most significant results to date
5. **Breakthrough Analysis** - Any breakthrough discoveries and their impact
6. **Discovery Loop Efficiency** - How well the hypothesis-experiment-result cycle is working
7. **Publication Strategy** - Current and planned publications
8. **Risk Assessment** - Scientific and operational risks
9. **Next Iteration** - Top 3 recommended next steps
10. **Impact Forecast** - Predicted scientific and commercial impact`;

    const result = await callAI(prompt, 'You are a chief science officer preparing strategic research progress reports for stakeholders. You excel at synthesizing complex scientific information into clear, actionable insights.');
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- New AI endpoints (apply3) ----------

// 1) Literature gap finder
router.post('/literature-gap-finder', async (req, res) => {
  try {
    const { project_id, domain, focus_area } = req.body;
    let projectInfo = '';
    if (project_id) {
      const pr = await pool.query('SELECT * FROM projects WHERE id = $1', [project_id]);
      if (pr.rows.length) {
        const p = pr.rows[0];
        projectInfo = `Project: ${p.name}\nDomain: ${p.domain}\nGoal: ${p.goal}\n`;
      }
    }
    const prompt = `Identify open research gaps and underexplored areas for the following research context.

${projectInfo}Domain: ${domain || 'general science'}
Focus area: ${focus_area || 'broad'}

Return a structured analysis:
1. **Mapped Knowns** - 4-6 well-established findings in this area
2. **Open Questions** - 5-8 specific unanswered questions
3. **Underexplored Methods** - methodological gaps and instrumentation gaps
4. **Conflicting Evidence** - claims where the literature disagrees
5. **High-Leverage Gaps** - 3 gaps with the highest potential impact if filled
6. **Recommended Searches** - 5 PubMed/arXiv search queries to validate the gaps`;
    const result = await callAI(prompt, 'You are a senior research librarian and meta-analyst. You identify true gaps in the scientific literature and rank them by impact.');
    await logActivity(req, 'ai.literature-gap-finder', 'project', project_id || null, (focus_area || domain || '').slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 2) Predict experiment outcome
router.post('/predict-experiment-outcome', async (req, res) => {
  try {
    const { experiment_id, hypothesis, design, methodology } = req.body;
    let extra = '';
    if (experiment_id) {
      const er = await pool.query('SELECT e.*, h.statement AS hyp FROM experiments e LEFT JOIN hypotheses h ON e.hypothesis_id = h.id WHERE e.id = $1', [experiment_id]);
      if (er.rows.length) {
        const e = er.rows[0];
        extra = `Stored Title: ${e.title}\nStored Hypothesis: ${e.hyp}\nStored Design: ${e.design}\nStored Methodology: ${e.methodology}\n`;
      }
    }
    const prompt = `Predict the most likely outcome of the following scientific experiment before it is run.

${extra}Hypothesis: ${hypothesis || '(see above)'}
Design: ${design || '(see above)'}
Methodology: ${methodology || '(see above)'}

Provide:
1. **Most Likely Outcome** - one-sentence prediction
2. **Predicted Effect Size** - small / medium / large with rationale
3. **Confidence Range** - low/med/high probability buckets for positive, negative, inconclusive
4. **Key Failure Modes** - 4 ways the experiment could go wrong
5. **Pre-registration Checklist** - what to lock in before running
6. **Decision Rule** - clear pass/fail criteria
7. **Power Concerns** - sample-size red flags
8. **Bias Risks** - selection, measurement, analytic`;
    const result = await callAI(prompt, 'You are an experienced experimental scientist and pre-registration reviewer. You forecast likely outcomes with explicit assumptions.');
    await logActivity(req, 'ai.predict-experiment-outcome', 'experiment', experiment_id || null, (hypothesis || '').slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 3) Replication risk scorer
router.post('/replication-risk-scorer', async (req, res) => {
  try {
    const { result_id, outcome, significance_pct, conclusion, data_summary } = req.body;
    let extra = '';
    if (result_id) {
      const rr = await pool.query('SELECT * FROM results WHERE id = $1', [result_id]);
      if (rr.rows.length) {
        const r = rr.rows[0];
        extra = `Stored Outcome: ${r.outcome}\nSignificance: ${r.significance_pct}\nConclusion: ${r.conclusion}\nData Summary: ${r.data_summary}\n`;
      }
    }
    const prompt = `Score the replication risk of the following scientific result.

${extra}Outcome: ${outcome || '(see above)'}
Significance %: ${significance_pct || '(see above)'}
Conclusion: ${conclusion || '(see above)'}
Data summary: ${data_summary || '(see above)'}

Return:
1. **Replication Risk Score** - 0 (very low) to 10 (very high)
2. **Top Risk Factors** - 4-6 specific reasons (small N, p-hacking risk, publication bias, etc.)
3. **Robustness Indicators** - factors that increase confidence
4. **Replication Plan** - exact steps to replicate at low cost
5. **Statistical Critique** - p-value, effect size, CI, multiple comparisons
6. **Domain Plausibility** - prior probability the effect is real
7. **Recommended Action** - publish / replicate first / extend / reject`;
    const result = await callAI(prompt, 'You are a methodologist and meta-research reviewer who calibrates the replication risk of scientific results.');
    await logActivity(req, 'ai.replication-risk-scorer', 'result', result_id || null, (conclusion || '').slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 4) Novelty assessor for draft abstract
router.post('/novelty-assessor', async (req, res) => {
  try {
    const { abstract, domain } = req.body;
    if (!abstract || !abstract.trim()) return res.status(400).json({ error: 'abstract is required' });
    const prompt = `Assess the novelty of the following draft scientific abstract.

Domain: ${domain || 'general science'}

Abstract:
"""
${abstract}
"""

Return:
1. **Novelty Score** - 0 (incremental) to 10 (paradigm shift)
2. **Core Claims Extracted** - bullet list of what is actually new
3. **Likely Prior Art** - 4-6 areas of existing work this overlaps with
4. **Differentiators** - what genuinely separates this from prior art
5. **Originality Risks** - claims most likely to have been done before
6. **Suggested Search Strings** - 5 queries to validate novelty in PubMed/arXiv/Google Scholar
7. **Framing Suggestions** - rewrites that more sharply highlight novelty
8. **Verdict** - novel / incremental / unclear with reasoning`;
    const result = await callAI(prompt, 'You are a journal editor and novelty assessor. You compare draft abstracts against the broader literature and rank novelty rigorously.');
    await logActivity(req, 'ai.novelty-assessor', 'abstract', null, abstract.slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 5) Methods-section critic
router.post('/methods-critic', async (req, res) => {
  try {
    const { methods, domain, study_type } = req.body;
    if (!methods || !methods.trim()) return res.status(400).json({ error: 'methods is required' });
    const prompt = `Critique the following methods section of a scientific study.

Domain: ${domain || 'general science'}
Study type: ${study_type || 'unspecified'}

Methods:
"""
${methods}
"""

Provide a thorough critique:
1. **Reproducibility Issues** - missing details that would block replication
2. **Statistical Methods Critique** - test choice, multiple comparisons, assumptions
3. **Sample / Cohort Concerns** - selection, exclusions, power
4. **Controls & Blinding** - what's missing or weak
5. **Ethics / Compliance Gaps** - if applicable
6. **Pre-registration Adherence** - deviations from plan
7. **Recommended Revisions** - prioritized, concrete edits
8. **Methods Section Score** - 0-10 with rationale`;
    const result = await callAI(prompt, 'You are a peer reviewer for a top-tier scientific journal. You critique methods sections with rigor and clarity.');
    await logActivity(req, 'ai.methods-critic', 'methods', null, (study_type || domain || '').slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// ---------- Apply pass 7: 4 additional AI endpoints from backlog ----------

// 6) Citation network insight
router.post('/citation-network-insight', async (req, res) => {
  try {
    const { topic, seed_papers, depth } = req.body;
    if (!topic || !topic.trim()) return res.status(400).json({ error: 'topic is required' });
    const prompt = `Generate a citation network insight report for the following research topic.

Topic: ${topic}
Seed papers / authors: ${seed_papers || '(none provided)'}
Citation graph depth to consider: ${depth || '2-hop'}

Provide:
1. **Hub Papers** - 5-8 likely high-centrality papers in this network (with year, journal, authors)
2. **Influential Authors** - 5-7 authors whose work anchors the citation graph
3. **Emerging Clusters** - 3-5 sub-communities forming around new methods or datasets
4. **Bridging Papers** - work that connects otherwise disconnected sub-fields
5. **Citation Velocity** - which papers are accelerating vs decelerating in citations
6. **Self-Citation / Echo-Chamber Risks** - groups that disproportionately cite each other
7. **Suggested Next Reads** - 5 high-leverage papers to read next, ranked
8. **Open Network Questions** - 3 questions a network analyst should investigate further`;
    const result = await callAI(prompt, 'You are a scientometrics expert specializing in citation network analysis (Scopus, Web of Science, OpenAlex, Semantic Scholar). You map influence flow and emerging fronts in a literature.');
    await logActivity(req, 'ai.citation-network-insight', 'topic', null, topic.slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 7) Dataset quality assessor
router.post('/dataset-quality-assessor', async (req, res) => {
  try {
    const { dataset_name, description, schema_summary, size, intended_use } = req.body;
    if (!dataset_name || !dataset_name.trim()) return res.status(400).json({ error: 'dataset_name is required' });
    const prompt = `Audit the quality of the following scientific dataset.

Dataset name: ${dataset_name}
Description: ${description || '(not provided)'}
Schema summary: ${schema_summary || '(not provided)'}
Approximate size: ${size || '(unknown)'}
Intended downstream use: ${intended_use || '(unspecified)'}

Return a structured quality audit:
1. **Quality Score** - 0 (unusable) to 10 (gold-standard); justify
2. **Completeness** - missingness, coverage gaps, expected vs observed cardinalities
3. **Provenance & Licensing** - source clarity, license, terms of use red flags
4. **Bias & Representativeness** - selection bias, demographic / geographic skews
5. **Label Quality** - inter-annotator agreement, label noise, ontology drift
6. **Leakage & Splits** - train/val/test leakage risks, temporal / patient / site splits
7. **Statistical Sanity Checks** - outliers, duplicates, distributional shift between splits
8. **Recommended Remediation** - prioritized concrete actions before downstream use
9. **Suitability Verdict** - per intended_use: fit / fit-with-caveats / not-fit`;
    const result = await callAI(prompt, 'You are a senior data engineer and ML reliability reviewer who audits scientific datasets for fitness-for-use before model training or publication.');
    await logActivity(req, 'ai.dataset-quality-assessor', 'dataset', null, dataset_name.slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 8) IP / patent landscape briefer
router.post('/ip-patent-landscape', async (req, res) => {
  try {
    const { technology, jurisdictions, time_window, applicant_focus } = req.body;
    if (!technology || !technology.trim()) return res.status(400).json({ error: 'technology is required' });
    const prompt = `Produce a patent / IP landscape briefing for the following technology.

Technology: ${technology}
Jurisdictions: ${jurisdictions || 'US, EP, JP, CN (default major-five)'}
Time window: ${time_window || 'last 10 years'}
Applicant focus: ${applicant_focus || '(none specified — include top assignees)'}

Provide an actionable briefing:
1. **Landscape Summary** - 1-paragraph state of the IP front for this technology
2. **Top Assignees** - 6-10 leading patent holders (corporate / academic) with rough share
3. **Key Patent Families** - 6-8 anchor families with USPTO/EP-style ID examples
4. **Claim-Scope Themes** - what's typically claimed (composition, method, apparatus, use)
5. **White-Space Opportunities** - 3-5 plausible un-patented niches
6. **Freedom-to-Operate Risks** - 3-5 patents most likely to block a new entrant
7. **Likely Litigation Hotspots** - jurisdictions / claim types with elevated risk
8. **Recommended Filing Strategy** - prioritized claim drafting + jurisdiction sequencing
9. **Caveat** - this is an AI-generated briefing, not legal advice; recommend a patent attorney review`;
    const result = await callAI(prompt, 'You are a patent landscape analyst with experience across USPTO, EPO, and WIPO databases. You map IP terrain for R&D and licensing strategy. Always flag when legal counsel is required.');
    await logActivity(req, 'ai.ip-patent-landscape', 'technology', null, technology.slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

// 9) Anomaly detector for experimental data
router.post('/anomaly-detector', async (req, res) => {
  try {
    const { experiment_id, data_summary, expected_range, units } = req.body;
    let extra = '';
    if (experiment_id) {
      const er = await pool.query('SELECT e.*, h.statement AS hyp FROM experiments e LEFT JOIN hypotheses h ON e.hypothesis_id = h.id WHERE e.id = $1', [experiment_id]);
      if (er.rows.length) {
        const e = er.rows[0];
        extra = `Stored Experiment Title: ${e.title}\nStored Hypothesis: ${e.hyp}\nStored Methodology: ${e.methodology}\nStored Result Summary: ${e.result_summary}\n`;
      }
    }
    if (!data_summary && !extra) return res.status(400).json({ error: 'data_summary or experiment_id with stored data is required' });
    const prompt = `Scan the following experimental data for anomalies and integrity issues.

${extra}Data summary / sample: ${data_summary || '(see above)'}
Expected range / units: ${expected_range || '(unspecified)'} / ${units || '(unspecified)'}

Return a structured anomaly report:
1. **Anomalies Found** - bulleted list with severity (low / med / high) and where each appears
2. **Suspected Causes** - instrument drift, contamination, transcription error, batch effect, fraud risk
3. **Statistical Outliers** - IQR / z-score / Tukey-fence calls if applicable
4. **Data Integrity Checks** - duplicates, identical sequences, impossible values, unit mismatches
5. **Distribution Shape Flags** - bimodality, truncation, ceiling/floor effects
6. **Batch / Site Effects** - signs of confounding by batch, day, operator, plate
7. **Recommended Next Tests** - exact diagnostics to confirm or rule out each anomaly
8. **Severity Score** - overall 0 (clean) to 10 (do-not-publish-until-resolved)`;
    const result = await callAI(prompt, 'You are a data integrity reviewer for a scientific journal. You catch anomalies, batch effects, and image / numeric inconsistencies that human reviewers often miss.');
    await logActivity(req, 'ai.anomaly-detector', 'experiment', experiment_id || null, (data_summary || '').slice(0, 200));
    res.json({ result });
  } catch (err) { aiError(res, err); }
});

module.exports = router;

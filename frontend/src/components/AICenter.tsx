import { useState } from 'react';
import { Sparkles, FlaskConical, Microscope, BarChart2, FileText, BookOpen, TrendingUp, ShieldAlert, Lightbulb, ClipboardCheck, Network, Database, Scale, AlertTriangle } from 'lucide-react';
import { api } from '../api';
import AIResponse from './AIResponse';

type Sample = { label: string; values: Record<string, string> };
type Tool = { id: string; title: string; description: string; icon: any; color: string; fields: { key: string; label: string; type: string; placeholder: string }[]; samples?: Sample[] };

const tools: Tool[] = [
  { id: 'generate-hypothesis', title: 'Generate Hypothesis', description: 'Generate novel, testable hypotheses for research projects using AI.', icon: FlaskConical, color: 'bg-violet-100 text-violet-600', fields: [{ key: 'project_id', label: 'Project ID', type: 'number', placeholder: '1' }, { key: 'domain', label: 'Research Domain', type: 'text', placeholder: 'oncology' }],
    samples: [
      { label: 'CRISPR-Cas13 dx', values: { project_id: '1', domain: 'molecular diagnostics — CRISPR-Cas13a SHERLOCK' } },
      { label: 'LaH10 superconductor', values: { project_id: '2', domain: 'high-pressure hydride superconductors (LaH10 at 170 GPa)' } },
      { label: 'MOF direct air capture', values: { project_id: '3', domain: 'amine-functionalized MOFs for direct air capture (mmen-Mg2(dobpdc))' } },
    ] },
  { id: 'design-experiment', title: 'Design Experiment', description: 'Create rigorous experimental designs to test scientific hypotheses.', icon: Microscope, color: 'bg-teal-100 text-teal-600', fields: [{ key: 'hypothesis', label: 'Hypothesis Statement', type: 'text', placeholder: 'Describe your hypothesis...' }, { key: 'domain', label: 'Domain', type: 'text', placeholder: 'oncology' }],
    samples: [
      { label: 'AlphaFold diffusion', values: { hypothesis: 'A diffusion-based generative head fine-tuned on AlphaFold2 embeddings will improve antibody CDR-H3 loop pLDDT by >=8 points vs the AF2 multimer baseline on the SAbDab held-out set.', domain: 'computational structural biology' } },
      { label: 'Solid-state Li battery', values: { hypothesis: 'A 3 µm Li6PS5Cl argyrodite separator with 2 wt% LiF interlayer will suppress lithium dendrite nucleation and exceed 800 cycles at 1C / 25 °C with <20% capacity fade.', domain: 'solid-state lithium-metal batteries' } },
      { label: 'Cas13 viral dx', values: { hypothesis: 'LwaCas13a guided by a tiled crRNA pool against SARS-CoV-2 ORF1ab will achieve 95% sensitivity at 10 copies/µL within 30 minutes via a lyophilized lateral-flow readout.', domain: 'CRISPR-Cas13 nucleic acid diagnostics' } },
    ] },
  { id: 'analyze-results', title: 'Analyze Results', description: 'Analyze experimental results for statistical significance and implications.', icon: BarChart2, color: 'bg-emerald-100 text-emerald-600', fields: [{ key: 'significance', label: 'Significance %', type: 'number', placeholder: '95.5' }, { key: 'outcome', label: 'Outcome', type: 'text', placeholder: 'positive/negative/inconclusive' }, { key: 'hypothesis', label: 'Tested Hypothesis', type: 'text', placeholder: 'What was tested' }],
    samples: [
      { label: 'KRAS G12C trial', values: { significance: '99.2', outcome: 'positive', hypothesis: 'Sotorasib (AMG 510) at 960 mg QD will produce ORR >= 30% in KRAS G12C-mutant NSCLC after platinum-doublet failure (CodeBreaK 100 cohort).' } },
      { label: 'MOF CO2 capture', values: { significance: '97.5', outcome: 'positive', hypothesis: 'mmen-Mg2(dobpdc) MOF retains >2.0 mmol/g CO2 uptake at 400 ppm and 40 °C across 1000 humid TSA cycles.' } },
      { label: 'Fusion RL on TCV', values: { significance: '88.0', outcome: 'inconclusive', hypothesis: 'A model-based RL controller deployed on TCV tokamak reduces vertical-instability-triggered disruptions by >=40% vs the PID baseline over 200 plasma shots.' } },
    ] },
  { id: 'discovery-report', title: 'Discovery Loop Report', description: 'Generate comprehensive progress report for a research project.', icon: FileText, color: 'bg-blue-100 text-blue-600', fields: [{ key: 'project_id', label: 'Project ID', type: 'number', placeholder: '1' }],
    samples: [
      { label: 'Project #1', values: { project_id: '1' } },
      { label: 'Project #2', values: { project_id: '2' } },
      { label: 'Project #3', values: { project_id: '3' } },
    ] },
  { id: 'literature-gap-finder', title: 'Literature Gap Finder', description: 'Identify open research gaps and underexplored questions for a project domain.', icon: BookOpen, color: 'bg-amber-100 text-amber-600', fields: [{ key: 'project_id', label: 'Project ID', type: 'number', placeholder: '1' }, { key: 'domain', label: 'Domain', type: 'text', placeholder: 'oncology' }, { key: 'focus_area', label: 'Focus Area', type: 'text', placeholder: 'KRAS allosteric inhibition' }],
    samples: [
      { label: 'Cas13 off-target', values: { project_id: '1', domain: 'CRISPR-Cas13 diagnostics', focus_area: 'collateral RNA cleavage off-target effects in human primary cells (Doudna lab line of work)' } },
      { label: 'Protein design', values: { project_id: '2', domain: 'de novo protein design', focus_area: 'RFdiffusion + ProteinMPNN for membrane protein scaffolds (Baker lab follow-ups in Nature 2023)' } },
      { label: 'LaH10 ambient', values: { project_id: '3', domain: 'hydride superconductivity', focus_area: 'pathways to ambient-pressure metastability of LaH10-class superhydrides' } },
    ] },
  { id: 'predict-experiment-outcome', title: 'Predict Experiment Outcome', description: 'Forecast the most likely outcome of an experiment before it runs.', icon: TrendingUp, color: 'bg-indigo-100 text-indigo-600', fields: [{ key: 'experiment_id', label: 'Experiment ID (optional)', type: 'number', placeholder: '1' }, { key: 'hypothesis', label: 'Hypothesis', type: 'text', placeholder: 'Hypothesis being tested' }, { key: 'design', label: 'Design', type: 'text', placeholder: 'In vitro dose-response matrix' }, { key: 'methodology', label: 'Methodology', type: 'text', placeholder: 'Brief methods' }],
    samples: [
      { label: 'Sotorasib NSCLC', values: { experiment_id: '1', hypothesis: 'Sotorasib produces ORR >= 30% in KRAS G12C-mutant NSCLC after platinum failure.', design: 'Single-arm phase 2, n=126, 960 mg QD, RECIST 1.1 readout at 12 weeks.', methodology: 'Central radiology review; Kaplan-Meier PFS; tumor biopsies for KRAS allele frequency by ddPCR.' } },
      { label: 'AlphaFold CDR-H3', values: { experiment_id: '2', hypothesis: 'A diffusion head on AF2 embeddings improves CDR-H3 pLDDT by >=8 on SAbDab.', design: 'Held-out 200-antibody SAbDab benchmark; paired AF2-multimer vs AF2+diffusion; bootstrap 95% CI on mean pLDDT delta.', methodology: '5-fold cross-validation, A100 80GB, 50k diffusion steps, RMSD<2Å acceptance, blinded evaluation.' } },
      { label: 'Li-S argyrodite', values: { experiment_id: '3', hypothesis: 'Li6PS5Cl + LiF interlayer enables >800 cycles at 1C with <20% fade.', design: '2032 coin cells, NMC811 cathode, 4.2 V cutoff, 25 °C, n=12 replicates per arm.', methodology: 'Galvanostatic cycling on Neware BTS; EIS every 50 cycles; post-mortem cryo-FIB-SEM at 800 cycles.' } },
    ] },
  { id: 'replication-risk-scorer', title: 'Replication Risk Scorer', description: 'Score the replication risk of a stored or pasted scientific result.', icon: ShieldAlert, color: 'bg-rose-100 text-rose-600', fields: [{ key: 'result_id', label: 'Result ID (optional)', type: 'number', placeholder: '1' }, { key: 'outcome', label: 'Outcome', type: 'text', placeholder: 'positive/negative' }, { key: 'significance_pct', label: 'Significance %', type: 'number', placeholder: '95' }, { key: 'conclusion', label: 'Conclusion', type: 'text', placeholder: 'Brief conclusion' }, { key: 'data_summary', label: 'Data Summary', type: 'text', placeholder: 'N=, effect, CI, etc.' }],
    samples: [
      { label: 'LK-99 claim', values: { result_id: '1', outcome: 'positive', significance_pct: '72', conclusion: 'Cu-doped lead apatite (LK-99) shows room-temperature superconductivity at ambient pressure (Lee et al., arXiv 2023).', data_summary: 'N=3 samples, partial Meissner-like flux expulsion, resistance drop near 378 K, no zero-resistance plateau confirmed; no independent group has reproduced.' } },
      { label: 'Sotorasib ORR', values: { result_id: '2', outcome: 'positive', significance_pct: '99', conclusion: 'Sotorasib achieves 37.1% ORR in KRAS G12C NSCLC (CodeBreaK 100, NEJM 2021).', data_summary: 'N=126, ORR 37.1% (95% CI 28.6-46.2), median DOR 11.1 mo, central blinded review, multi-site phase 2.' } },
      { label: 'µBiome diet effect', values: { result_id: '3', outcome: 'positive', significance_pct: '94', conclusion: 'Plant-based diet shifts gut Prevotella/Bacteroides ratio within 14 days.', data_summary: 'N=22, single site, 16S rRNA only (no shotgun metagenomics), no diet-controlled arm, p=0.04 after Benjamini-Hochberg.' } },
    ] },
  { id: 'novelty-assessor', title: 'Novelty Assessor', description: 'Assess novelty of a draft scientific abstract vs prior art.', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-600', fields: [{ key: 'domain', label: 'Domain', type: 'text', placeholder: 'oncology' }, { key: 'abstract', label: 'Abstract', type: 'text', placeholder: 'Paste the draft abstract...' }],
    samples: [
      { label: 'Bertozzi glycan', values: { domain: 'chemical biology — bioorthogonal chemistry', abstract: 'We report a copper-free strain-promoted azide-alkyne cycloaddition (SPAAC) variant using a fluorinated cyclooctyne (DIFO-3) that achieves k2 = 4.1 M-1 s-1 in live HeLa cells, a 12-fold rate enhancement over BCN. Sialic-acid metabolic labeling with Ac4ManNAz followed by DIFO-3-Cy5 yielded single-cell glycan imaging at 100 nM probe with no observable cytotoxicity at 24 h. We further demonstrate in vivo zebrafish embryo labeling, extending Bertozzi-style bioorthogonal imaging to whole-animal developmental biology.' } },
      { label: 'Hassabis fold', values: { domain: 'computational structural biology', abstract: 'AlphaFold-Diffusion (AF-D) augments AlphaFold2 with a denoising-diffusion head conditioned on MSA embeddings to sample alternative conformations of intrinsically disordered regions (IDRs). On a held-out CASP15 IDR benchmark (n=42), AF-D achieves median pLDDT 78.4 vs 61.2 for AF2-multimer (p < 0.001, paired Wilcoxon), and recovers 7/9 known cryptic binding pockets validated against PDB ligand-bound structures. We release AF-D weights and a 50k-decoy IDR ensemble.' } },
      { label: 'Doudna Cas13', values: { domain: 'CRISPR diagnostics', abstract: 'We engineer LbuCas13a with a dual-aptamer trans-cleavage reporter (DART) for room-temperature, instrument-free detection of SARS-CoV-2 and influenza A from unprocessed saliva. DART achieves 10 copies/µL LoD in 18 minutes via lateral-flow readout, with 96.4% PPA and 99.1% NPA across n=412 clinical samples vs RT-qPCR. Lyophilized reagents remain stable for 12 weeks at 30 °C, enabling decentralized deployment.' } },
    ] },
  { id: 'citation-network-insight', title: 'Citation Network Insight', description: 'Map hub papers, influential authors, and emerging clusters in a topic\'s citation network.', icon: Network, color: 'bg-sky-100 text-sky-600', fields: [{ key: 'topic', label: 'Topic', type: 'text', placeholder: 'KRAS G12C inhibitors' }, { key: 'seed_papers', label: 'Seed Papers / Authors (optional)', type: 'text', placeholder: 'Skoulidis et al. 2021; Doudna; Hassabis' }, { key: 'depth', label: 'Depth (optional)', type: 'text', placeholder: '2-hop' }],
    samples: [
      { label: 'CRISPR-Cas13 dx', values: { topic: 'CRISPR-Cas13 diagnostics (SHERLOCK / DETECTR / Cas13a collateral cleavage)', seed_papers: 'Gootenberg et al. 2017 Science; Abudayyeh et al. 2017 Nature; Doudna lab 2018-2023', depth: '2-hop' } },
      { label: 'AlphaFold', values: { topic: 'AlphaFold and de novo protein structure prediction', seed_papers: 'Jumper et al. 2021 Nature; Baek et al. 2021 Science (RoseTTAFold); Watson et al. 2023 Nature (RFdiffusion)', depth: '2-hop' } },
      { label: 'KRAS G12C', values: { topic: 'KRAS G12C covalent inhibitors in NSCLC', seed_papers: 'Ostrem et al. 2013 Nature; Skoulidis CodeBreaK 100 NEJM 2021; Hong et al. AMG 510', depth: '2-hop' } },
    ] },
  { id: 'dataset-quality-assessor', title: 'Dataset Quality Assessor', description: 'Audit completeness, bias, label noise, leakage, and fitness-for-use of a scientific dataset.', icon: Database, color: 'bg-lime-100 text-lime-600', fields: [{ key: 'dataset_name', label: 'Dataset Name', type: 'text', placeholder: 'TCGA-LUAD' }, { key: 'description', label: 'Description', type: 'text', placeholder: 'short description' }, { key: 'schema_summary', label: 'Schema Summary', type: 'text', placeholder: 'columns, types, label set' }, { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g. 12k samples, 38 features' }, { key: 'intended_use', label: 'Intended Use', type: 'text', placeholder: 'train survival model' }],
    samples: [
      { label: 'CASP15 IDR', values: { dataset_name: 'CASP15-IDR held-out set', description: '42 intrinsically disordered region targets curated from CASP15 round; experimental PDB structures + AF2-multimer baseline predictions.', schema_summary: 'target_id (str), sequence (str), pdb_id (str), length (int), pLDDT_AF2 (float), TM_score_AF2 (float)', size: '42 targets, ~9k residues', intended_use: 'Held-out benchmark for AlphaFold-Diffusion (AF-D) on IDRs' } },
      { label: 'SAbDab CDR-H3', values: { dataset_name: 'SAbDab CDR-H3 antibody loops', description: 'Structural Antibody Database CDR-H3 loops with experimentally solved coordinates.', schema_summary: 'sabdab_id, heavy_seq, light_seq, cdr_h3, resolution_A, organism, antigen_class', size: '~5,200 antibody chains', intended_use: 'Fine-tune diffusion head on AF2 embeddings; held-out 200 for eval' } },
      { label: 'CodeBreaK 100', values: { dataset_name: 'CodeBreaK 100 trial dataset', description: 'Phase 2 single-arm trial of sotorasib 960 mg QD in pre-treated KRAS G12C NSCLC.', schema_summary: 'patient_id, age, sex, prior_lines, KRAS_VAF_ddPCR, baseline_sld, week12_sld, ORR_call, PFS_days, OS_days', size: 'N=126 patients, 12-month follow-up', intended_use: 'Retrospective biomarker analysis (KRAS allele frequency vs response)' } },
    ] },
  { id: 'ip-patent-landscape', title: 'IP / Patent Landscape', description: 'Map top assignees, white space, FTO risks, and filing strategy for a technology (AI brief — not legal advice).', icon: Scale, color: 'bg-purple-100 text-purple-600', fields: [{ key: 'technology', label: 'Technology', type: 'text', placeholder: 'mRNA lipid nanoparticles for solid tumors' }, { key: 'jurisdictions', label: 'Jurisdictions', type: 'text', placeholder: 'US, EP, JP, CN' }, { key: 'time_window', label: 'Time Window', type: 'text', placeholder: 'last 10 years' }, { key: 'applicant_focus', label: 'Applicant Focus (optional)', type: 'text', placeholder: 'Moderna, BioNTech, Arcturus' }],
    samples: [
      { label: 'mRNA-LNP onco', values: { technology: 'mRNA lipid nanoparticle delivery for solid tumor immunotherapy', jurisdictions: 'US, EP, JP, CN', time_window: 'last 10 years', applicant_focus: 'Moderna, BioNTech, Arcturus, Acuitas, Genevant' } },
      { label: 'CRISPR base edit', values: { technology: 'CRISPR base editing (cytosine and adenine deaminase fusions) for in vivo therapy', jurisdictions: 'US, EP, JP, CN, KR', time_window: 'last 8 years', applicant_focus: 'Beam Therapeutics, Verve, Editas, Broad Institute' } },
      { label: 'Solid-state Li', values: { technology: 'Solid-state lithium-metal batteries with sulfide / argyrodite (Li6PS5Cl) electrolytes', jurisdictions: 'US, EP, JP, CN, KR', time_window: 'last 10 years', applicant_focus: 'Toyota, Samsung SDI, QuantumScape, Solid Power, LG ES' } },
    ] },
  { id: 'anomaly-detector', title: 'Data Anomaly Detector', description: 'Scan experimental data for outliers, batch effects, integrity issues, and pre-publication red flags.', icon: AlertTriangle, color: 'bg-orange-100 text-orange-600', fields: [{ key: 'experiment_id', label: 'Experiment ID (optional)', type: 'number', placeholder: '1' }, { key: 'data_summary', label: 'Data Summary', type: 'text', placeholder: 'Means, SDs, N per group, raw outliers' }, { key: 'expected_range', label: 'Expected Range', type: 'text', placeholder: '0.5 - 2.5' }, { key: 'units', label: 'Units', type: 'text', placeholder: 'mmol/g' }],
    samples: [
      { label: 'MOF CO2 uptake', values: { experiment_id: '', data_summary: 'CO2 uptake by mmen-Mg2(dobpdc) MOF over 1000 humid TSA cycles, n=12 batches. Means: B1-B11 = 2.05-2.18 mmol/g; B12 = 0.41 mmol/g. SD within batch = 0.04 mmol/g except B12 (SD=0.31). No instrument recalibration logged between B11 and B12.', expected_range: '2.0 - 2.3', units: 'mmol/g' } },
      { label: 'Coin-cell cycles', values: { experiment_id: '', data_summary: 'Li6PS5Cl + LiF coin cells, n=12 per arm, 1C cycling at 25°C. Capacity retention at cycle 800: 84%, 86%, 85%, 83%, 87%, 85%, 21%, 22%, 86%, 84%, 82%, 85%. Two cells (#7, #8) crashed identically at cycle 412.', expected_range: '80 - 90', units: '% retention' } },
      { label: 'qPCR Ct', values: { experiment_id: '', data_summary: 'qPCR Ct values for ORF1ab across 96-well plate, 3 plates (n=288). Plate 1 mean Ct = 24.1 (SD 1.2), Plate 2 mean Ct = 24.3 (SD 1.3), Plate 3 mean Ct = 19.8 (SD 0.6). Operator changed between plates 2 and 3; no NTC reported for plate 3.', expected_range: '20 - 28', units: 'Ct cycles' } },
    ] },
  { id: 'methods-critic', title: 'Methods Critic', description: 'Peer-review critique of a methods section for reproducibility and rigor.', icon: ClipboardCheck, color: 'bg-cyan-100 text-cyan-600', fields: [{ key: 'domain', label: 'Domain', type: 'text', placeholder: 'oncology' }, { key: 'study_type', label: 'Study Type', type: 'text', placeholder: 'RCT / observational / computational' }, { key: 'methods', label: 'Methods Text', type: 'text', placeholder: 'Paste the methods section...' }],
    samples: [
      { label: 'Phase 3 RCT', values: { domain: 'oncology — KRAS G12C NSCLC', study_type: 'phase 3 RCT (Lancet submission)', methods: 'Patients with previously treated KRAS p.G12C-mutant advanced NSCLC were randomized 2:1 to sotorasib 960 mg QD vs docetaxel 75 mg/m2 q3w. Stratification: prior lines (1 vs 2+), region, prior PD-1 exposure. Primary endpoint: PFS by blinded independent central review (RECIST 1.1). Sample size 330 powered at 90% to detect HR 0.65 (two-sided alpha 0.05). Analysis: stratified log-rank, Cox PH for HR, KM for medians. Crossover not permitted. Interim analysis at 75% events with O\'Brien-Fleming spending function.' } },
      { label: 'AF-D bench', values: { domain: 'computational structural biology', study_type: 'computational benchmark', methods: 'We evaluated AlphaFold-Diffusion (AF-D) on a held-out CASP15 IDR set (n=42 targets, no overlap with training). For each target we sampled 50 decoys and reported median pLDDT and TM-score vs the experimental PDB. Baseline: AlphaFold2-multimer v2.3.2 with default 5-recycle settings on the same MSAs (jackhmmer + HHblits, UniRef90 + BFD, March 2024 snapshot). Hardware: 8x A100 80GB. Training: 200k steps, AdamW lr 1e-4, batch 32, EMA decay 0.999. Statistical test: paired two-sided Wilcoxon, Holm correction across 3 metrics. All weights and decoys released under CC-BY-4.0.' } },
      { label: 'Cas13 clinical', values: { domain: 'CRISPR diagnostics', study_type: 'clinical validation (prospective)', methods: 'Nasopharyngeal swabs were collected from 412 symptomatic adults at three sites (Boston, Sao Paulo, Cape Town) and tested in parallel by DART-Cas13 lateral flow and Cobas SARS-CoV-2 RT-qPCR (reference). DART reagents: LwaCas13a (50 nM), tiled crRNA pool (10 nM each, 6 guides across ORF1ab), FAM-polyU-biotin reporter (200 nM), 30-minute room-temperature incubation, HybriDetect lateral flow. Operators were blinded to RT-qPCR result. Primary endpoints: PPA and NPA with two-sided 95% Wilson CIs. Discordant samples adjudicated by a third orthogonal RT-LAMP assay. IRB approval at all sites; written informed consent.' } },
    ] },
];

export default function AICenter() {
  const [formValues, setFormValues] = useState<Record<string, Record<string, string>>>({});
  const [loadingTool, setLoadingTool] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<any[]>([]);

  const setField = (toolId: string, key: string, value: string) => setFormValues(prev => ({ ...prev, [toolId]: { ...(prev[toolId] || {}), [key]: value } }));
  const applySample = (toolId: string, values: Record<string, string>) => setFormValues(prev => ({ ...prev, [toolId]: { ...values } }));

  const runTool = async (tool: typeof tools[0]) => {
    setLoadingTool(tool.id); setResults(prev => ({ ...prev, [tool.id]: '' }));
    try {
      const values = formValues[tool.id] || {};
      let result = '';
      if (tool.id === 'generate-hypothesis') { const { result: r } = await api.generateHypothesis({ project_id: parseInt(values.project_id||'1'), domain: values.domain, prior_results: [] }); result = r; }
      else if (tool.id === 'design-experiment') { const { result: r } = await api.designExperiment({ hypothesis: values.hypothesis, domain: values.domain }); result = r; }
      else if (tool.id === 'analyze-results') { const { result: r } = await api.analyzeResults({ result_data: { significance_pct: values.significance, outcome: values.outcome }, hypothesis: values.hypothesis }); result = r; }
      else if (tool.id === 'discovery-report') { const { result: r } = await api.discoveryReport({ project_id: parseInt(values.project_id||'1') }); result = r; }
      else if (tool.id === 'literature-gap-finder') { const { result: r } = await api.literatureGapFinder({ project_id: values.project_id ? parseInt(values.project_id) : undefined, domain: values.domain, focus_area: values.focus_area }); result = r; }
      else if (tool.id === 'predict-experiment-outcome') { const { result: r } = await api.predictExperimentOutcome({ experiment_id: values.experiment_id ? parseInt(values.experiment_id) : undefined, hypothesis: values.hypothesis, design: values.design, methodology: values.methodology }); result = r; }
      else if (tool.id === 'replication-risk-scorer') { const { result: r } = await api.replicationRiskScorer({ result_id: values.result_id ? parseInt(values.result_id) : undefined, outcome: values.outcome, significance_pct: values.significance_pct ? parseFloat(values.significance_pct) : undefined, conclusion: values.conclusion, data_summary: values.data_summary }); result = r; }
      else if (tool.id === 'novelty-assessor') { const { result: r } = await api.noveltyAssessor({ domain: values.domain, abstract: values.abstract }); result = r; }
      else if (tool.id === 'methods-critic') { const { result: r } = await api.methodsCritic({ domain: values.domain, study_type: values.study_type, methods: values.methods }); result = r; }
      else if (tool.id === 'citation-network-insight') { const { result: r } = await api.citationNetworkInsight({ topic: values.topic, seed_papers: values.seed_papers, depth: values.depth }); result = r; }
      else if (tool.id === 'dataset-quality-assessor') { const { result: r } = await api.datasetQualityAssessor({ dataset_name: values.dataset_name, description: values.description, schema_summary: values.schema_summary, size: values.size, intended_use: values.intended_use }); result = r; }
      else if (tool.id === 'ip-patent-landscape') { const { result: r } = await api.ipPatentLandscape({ technology: values.technology, jurisdictions: values.jurisdictions, time_window: values.time_window, applicant_focus: values.applicant_focus }); result = r; }
      else if (tool.id === 'anomaly-detector') { const { result: r } = await api.anomalyDetector({ experiment_id: values.experiment_id ? parseInt(values.experiment_id) : undefined, data_summary: values.data_summary, expected_range: values.expected_range, units: values.units }); result = r; }
      setResults(prev => ({ ...prev, [tool.id]: result }));
      setHistory(prev => [{ toolId: tool.id, title: tool.title, content: result, timestamp: new Date() }, ...prev.slice(0, 9)]);
    } catch (e: any) { setResults(prev => ({ ...prev, [tool.id]: 'Error: ' + e.message })); }
    finally { setLoadingTool(null); }
  };

  return (
    <div className="p-6">
      <div className="mb-6"><div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center"><Sparkles className="w-6 h-6 text-violet-600" /></div><div><h2 className="text-2xl font-bold text-gray-900">AI Center</h2><p className="text-gray-500 text-sm">AI-powered scientific discovery tools</p></div></div></div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tools.map(tool => {
          const Icon = tool.icon;
          const isLoading = loadingTool === tool.id;
          const result = results[tool.id];
          const values = formValues[tool.id] || {};
          return (
            <div key={tool.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start gap-3 mb-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tool.color}`}><Icon className="w-5 h-5" /></div><div><h3 className="font-bold text-gray-900">{tool.title}</h3><p className="text-sm text-gray-500 mt-0.5">{tool.description}</p></div></div>
              {tool.samples && tool.samples.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 mb-1.5">Try a sample:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {tool.samples.map((s, idx) => (
                      <button key={idx} type="button" onClick={() => applySample(tool.id, s.values)} className="text-xs px-2.5 py-1 rounded-md bg-gray-100 hover:bg-violet-100 text-gray-700 hover:text-violet-700 border border-gray-200 transition-colors">{s.label}</button>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-3 mb-4">
                {tool.fields.map(field => (
                  <div key={field.key}><label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label><input type={field.type} value={values[field.key]||''} onChange={e => setField(tool.id, field.key, e.target.value)} placeholder={field.placeholder} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 outline-none" /></div>
                ))}
              </div>
              <button onClick={() => runTool(tool)} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium text-sm transition-colors mb-4"><Sparkles className="w-4 h-4" />{isLoading ? 'Generating...' : 'Generate'}</button>
              {(isLoading || result) && <AIResponse content={result} title={tool.title} isLoading={isLoading} onRegenerate={() => runTool(tool)} />}
            </div>
          );
        })}
      </div>
      {history.length > 0 && (
        <div className="mt-8"><h3 className="font-bold text-gray-900 mb-4">Recent Queries</h3><div className="space-y-3">{history.map((item, i) => (<div key={i} className="bg-white rounded-xl border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="font-medium text-sm text-gray-900">{item.title}</span><span className="text-xs text-gray-400">{item.timestamp.toLocaleTimeString()}</span></div><p className="text-sm text-gray-600 line-clamp-2">{item.content.slice(0,150)}...</p></div>))}</div></div>
      )}
    </div>
  );
}

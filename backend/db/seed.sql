-- Users
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Admin User', 'admin')
ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      name = EXCLUDED.name,
      role = EXCLUDED.role;

-- Projects
INSERT INTO projects (name, domain, goal, status, lead_researcher, start_date, iteration_count, breakthrough_count) VALUES
('KRAS Inhibitor Discovery', 'oncology', 'Identify novel small molecule inhibitors targeting KRAS G12D mutation in pancreatic cancer', 'active', 'Dr. Sarah Chen', '2024-01-15', 23, 2),
('High-Temperature Superconductor', 'materials', 'Synthesize room-temperature superconducting materials using hydrogen-rich compounds', 'active', 'Dr. Michael Zhang', '2023-09-01', 45, 1),
('Protein Folding Prediction', 'protein_folding', 'Improve AlphaFold accuracy for intrinsically disordered proteins', 'active', 'Prof. Elena Rodriguez', '2024-02-01', 18, 0),
('Novel Antibiotic Development', 'antibiotic', 'Discover antibiotics effective against carbapenem-resistant Enterobacteriaceae', 'active', 'Dr. James Liu', '2023-11-20', 31, 3),
('Alzheimer Biomarker Panel', 'neuroscience', 'Develop blood-based biomarker panel for early Alzheimer detection', 'active', 'Dr. Anna Kowalski', '2024-01-05', 12, 1),
('mRNA Cancer Vaccine', 'oncology', 'Design personalized neoantigen mRNA vaccines for solid tumors', 'active', 'Dr. Robert Kim', '2023-08-15', 56, 4),
('Quantum Dot Solar Cell', 'materials', 'Achieve >30% efficiency using perovskite-quantum dot tandem cells', 'paused', 'Dr. Priya Patel', '2023-06-01', 28, 0),
('CRISPR Base Editor', 'protein_folding', 'Develop adenine base editors with reduced off-target effects', 'active', 'Dr. Thomas Brown', '2024-03-01', 8, 0),
('Antimicrobial Peptide Library', 'antibiotic', 'Generate and screen 10,000 novel antimicrobial peptides using ML', 'completed', 'Dr. Lisa Wang', '2023-05-01', 72, 5),
('Neural Organoid Model', 'neuroscience', 'Create patient-derived brain organoids for Parkinson disease modeling', 'active', 'Dr. Carlos Mendez', '2024-01-20', 15, 1),
('Catalytic CO2 Conversion', 'materials', 'Develop highly efficient catalyst for electrochemical CO2 reduction to ethylene', 'active', 'Dr. Yuki Tanaka', '2023-10-15', 38, 2),
('Single Cell RNA Sequencing', 'protein_folding', 'Map complete transcriptomic atlas of human pancreas at single-cell resolution', 'completed', 'Prof. David Lee', '2023-03-01', 91, 6),
('Drug Repurposing AI', 'oncology', 'Use graph neural networks to identify existing drugs for rare cancers', 'active', 'Dr. Fatima Hassan', '2024-02-15', 20, 1),
('Microbiome-Immunity Axis', 'neuroscience', 'Characterize gut microbiome influence on neuroinflammation in MS patients', 'active', 'Dr. Nina Petrov', '2023-12-01', 17, 0),
('Phage Therapy Optimization', 'antibiotic', 'Engineer bacteriophage cocktails for MDR Pseudomonas aeruginosa', 'active', 'Dr. Omar Al-Rashid', '2024-01-10', 25, 2);

-- Hypotheses
INSERT INTO hypotheses (project_id, statement, confidence_score, status, supporting_evidence, contradicting_evidence, generated_by) VALUES
(1, 'SOS1 inhibitor combination with KRAS G12D direct inhibitor will show synergistic activity in vitro', 0.78, 'testing', 'RAS-GEF inhibition shown in prior work; combination screens suggest synergy', 'Single agent KRAS inhibitors show resistance in 6 weeks', 'human'),
(1, 'Allosteric pocket formation in KRAS G12D is conformationally dynamic and druggable', 0.65, 'validated', 'MD simulations show cryptic pocket opening at 30% of trajectory', NULL, 'ai'),
(2, 'Hydrogen clathrate compounds stabilized with lanthanum show superconductivity above 200K', 0.45, 'testing', 'Theoretical predictions from DFT calculations', 'Previous synthesis attempts failed at lower pressures', 'human'),
(3, 'Attention mechanism modifications in transformer architecture can capture long-range IDP contacts', 0.82, 'validated', 'Preliminary benchmarks show 15% improvement on DisProt dataset', 'Some IDP regions remain unpredictable', 'ai'),
(4, 'Terpene-antibiotic hybrids will penetrate Gram-negative outer membranes more effectively', 0.71, 'testing', 'Lipophilicity calculations support membrane penetration', 'Terpene modification may reduce target binding', 'human'),
(4, 'Bacteriocin-derived peptides from Lactobacillus genus have novel MoA against CRE', 0.58, 'proposed', 'Genomic analysis of bacteriocin gene clusters', NULL, 'ai'),
(5, 'Phospho-tau 217 and GFAP ratio provides superior early AD detection vs Abeta42/40', 0.87, 'validated', 'Pilot study N=45 shows AUC=0.94', 'Sample size too small for definitive conclusion', 'human'),
(6, 'Long neoantigen peptides (>15 aa) elicit stronger CTL responses than short peptides', 0.73, 'validated', 'Phase I trial data supports this hypothesis', 'Proteasome processing may be limiting factor', 'human'),
(7, 'Quantum confinement in 2-5nm CsPbI3 QDs maximizes carrier multiplication efficiency', 0.61, 'proposed', 'Size-dependent bandgap tuning literature', NULL, 'ai'),
(8, 'Nuclear localization signal optimization reduces CRISPR base editor off-targets by 40%', 0.69, 'testing', 'Prior NLS optimization work showed promise', 'Off-target effects may have multiple causes', 'human'),
(10, 'Dopaminergic neuron vulnerability in organoids correlates with PINK1/Parkin pathway dysfunction', 0.76, 'testing', 'Patient-derived iPSC data support mitochondrial dysfunction', NULL, 'human'),
(11, 'Copper single-atom catalysts on nitrogen-doped carbon achieve >80% ethylene Faradaic efficiency', 0.68, 'testing', 'DFT calculations predict favorable *CO binding energy', 'Competing H2 evolution reaction difficult to suppress', 'ai'),
(13, 'Graph attention networks outperform random forests for drug-protein interaction prediction', 0.91, 'validated', 'Benchmark results on DrugBank dataset', NULL, 'ai'),
(14, 'Short-chain fatty acids from Bacteroides species mediate neuroinflammation via vagus nerve', 0.55, 'proposed', 'Metabolomics data shows SCFA correlation with symptom scores', NULL, 'human'),
(15, 'Phage tail fiber engineering enables targeting of O-antigen variants in P. aeruginosa', 0.72, 'testing', 'Structural biology of phage LKD16 tail fibers', NULL, 'human');

-- Experiments
INSERT INTO experiments (hypothesis_id, title, design, methodology, status, started_at, completed_at, result_summary) VALUES
(1, 'KRAS/SOS1 Combination Screen', 'In vitro dose-response matrix', 'CellTiter-Glo viability assay in PANC-1 cells with 10x10 dose matrix', 'completed', NOW() - INTERVAL '30 days', NOW() - INTERVAL '10 days', 'Synergy index 1.8, strongest at 100nM/50nM combination'),
(2, 'Cryo-EM Structural Analysis of KRAS G12D', 'Structural biology', 'KRAS G12D expressed in E. coli, purified, cryo-EM at 2.8A resolution', 'completed', NOW() - INTERVAL '60 days', NOW() - INTERVAL '20 days', 'Allosteric pocket confirmed, occupancy 23% of particles'),
(3, 'High-pressure synthesis of LaH10', 'Synthesis', 'Diamond anvil cell synthesis at 150-200 GPa, resistance measurements', 'running', NOW() - INTERVAL '14 days', NULL, NULL),
(4, 'IDP Benchmark on DisProt Database', 'Computational', 'Modified transformer tested on 500 IDP structures from DisProt v9', 'completed', NOW() - INTERVAL '45 days', NOW() - INTERVAL '15 days', 'TM-score improvement from 0.41 to 0.58 on IDP test set'),
(5, 'Terpene-Imipenem Hybrid Synthesis', 'Medicinal chemistry', 'Solid-phase synthesis of 24 terpene-beta-lactam hybrids', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days', '8/24 compounds showed MIC below 2 ug/mL vs CRE strains'),
(7, 'Plasma Biomarker Validation Study', 'Clinical observational', '180 participants: 60 early AD, 60 MCI, 60 controls, ELISA panels', 'completed', NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days', 'AUC 0.96 for early AD detection, sensitivity 89% at 95% specificity'),
(8, 'Neoantigen Peptide Length Optimization', 'In vitro immunology', 'PBMC assays testing peptides 8-25aa, IFN-gamma ELISpot, tetramer staining', 'completed', NOW() - INTERVAL '40 days', NOW() - INTERVAL '5 days', '15-18aa peptides elicit 3.2x stronger CTL response'),
(10, 'NLS Variant Screen for ABE8e', 'Molecular biology', 'Test 12 NLS combinations, GUIDE-seq off-target analysis', 'running', NOW() - INTERVAL '7 days', NULL, NULL),
(11, 'Organoid Mitochondrial Stress Assay', 'Cell biology', 'Seahorse XF analyzer, immunofluorescence for mitochondrial markers in 24 patient lines', 'running', NOW() - INTERVAL '21 days', NULL, NULL),
(13, 'GAT Drug Repurposing Benchmark', 'Machine learning', 'Train GAT on ChEMBL data, test on held-out rare cancer interactions', 'completed', NOW() - INTERVAL '55 days', NOW() - INTERVAL '20 days', 'AUROC 0.91 vs 0.78 for random forest baseline'),
(6, 'Bacteriocin MoA Characterization', 'Microbiology', 'Electron microscopy, lipopolysaccharide binding assay, membrane permeability', 'designed', NULL, NULL, NULL),
(12, 'Cu-SAS Catalyst Electrochemical Testing', 'Electrochemistry', 'Flow cell electrolyzer, GC and HPLC product analysis, 100h stability test', 'running', NOW() - INTERVAL '10 days', NULL, NULL),
(14, 'Phage Tail Fiber Engineering Round 1', 'Protein engineering', 'Site-directed mutagenesis of 15 residues, phage display selection', 'running', NOW() - INTERVAL '18 days', NULL, NULL),
(9, 'QD Size-Efficiency Correlation', 'Materials characterization', 'TEM, XRD, transient absorption spectroscopy on 6 QD size batches', 'completed', NOW() - INTERVAL '50 days', NOW() - INTERVAL '25 days', '3.2nm QDs show highest MEG efficiency at 1.8'),
(15, 'SCFA-Neuroinflammation Correlation', 'Translational', 'Fecal transplant in EAE mouse model, cytokine profiling, behavioral tests', 'designed', NULL, NULL, NULL);

-- Results
INSERT INTO results (experiment_id, outcome, significance_pct, breakthrough, data_summary, conclusion, published, published_at) VALUES
(1, 'positive', 99.5, false, 'Synergy index 1.8 at optimal dose combination, N=3 replicates, p<0.001', 'SOS1+KRAS G12D inhibitor combination is synergistic. Proceed to in vivo xenograft model', false, NULL),
(2, 'breakthrough', 99.9, true, 'Allosteric pocket confirmed in cryo-EM structure at 2.8A, visible in 23% of particles', 'First structural evidence of druggable allosteric pocket in KRAS G12D. High-impact publication warranted', true, NOW() - INTERVAL '5 days'),
(4, 'positive', 97.3, false, 'TM-score improved from 0.41 to 0.58 on 500-structure IDP benchmark', 'Modified transformer significantly improves IDP prediction. Preprint submitted', true, NOW() - INTERVAL '10 days'),
(5, 'positive', 95.1, false, '8/24 compounds with MIC <2 ug/mL, compound T7 shows MIC 0.25 ug/mL vs KPC-2', 'Terpene-beta-lactam hybrids show promising CRE activity. Expand to 96-compound library', false, NULL),
(6, 'breakthrough', 99.7, true, 'AUC 0.96 (CI: 0.93-0.99), sensitivity 89%, specificity 95%, N=180 participants', 'Superior biomarker panel validated. Breakthrough result supporting clinical translation', false, NULL),
(7, 'positive', 98.2, false, '15-18aa peptides show 3.2x higher IFN-gamma response, better tetramer binding', 'Long neoantigen peptides confirmed superior. Updated vaccine design adopted', true, NOW() - INTERVAL '15 days'),
(10, 'positive', 96.8, false, 'AUROC 0.91 vs 0.78 RF baseline on held-out test set of 2,847 drug-target pairs', 'GAT significantly outperforms traditional methods. Identified 23 repurposing candidates', false, NULL),
(14, 'positive', 91.2, false, '3.2nm QDs show MEG efficiency 1.8x, compared to 1.3x for 5nm QDs', 'Optimal QD size confirmed for quantum confinement. Proceed to tandem cell integration', false, NULL),
(9, 'negative', 45.0, false, 'Organoid growth inconsistent across patient lines, high technical variability', 'Technical challenges with organoid reproducibility. Optimize protocol before proceeding', false, NULL),
(8, 'positive', 93.5, false, '5/12 NLS variants show reduced off-targets in GUIDE-seq, best shows 38% reduction', 'NLS optimization shows promise. Full characterization ongoing', false, NULL),
(11, 'positive', 94.7, false, '18/24 patient lines show mitochondrial dysfunction, correlates with PD severity score (r=0.73)', 'Strong correlation confirmed. Expand cohort to 100 patient lines', false, NULL),
(3, 'inconclusive', 72.0, false, 'Synthesis successful but resistance measurements show instrument calibration issues', 'Results inconclusive due to technical issues. Repeat with calibrated instrument', false, NULL),
(13, 'positive', 97.8, false, 'Faradaic efficiency 76% ethylene at -1.1V vs RHE, stable for 80 hours', 'High efficiency achieved, approaching target. Optimize electrolyte composition', false, NULL),
(2, 'breakthrough', 99.2, true, 'Bacteriocin BM12 shows novel lipid II binding MoA, kills CRE in 30 min at 1 ug/mL', 'Novel antibiotic mechanism discovered. Major breakthrough for CRE treatment', true, NOW() - INTERVAL '3 days'),
(7, 'positive', 88.9, false, 'Tail fiber mutations expand host range to cover 85% of clinical O-antigen variants', 'Significant host range expansion achieved. Clinical cocktail design initiated', false, NULL);

-- Researchers
INSERT INTO researchers (name, institution, specialization, h_index, email, active_projects, publications_count, joined_date) VALUES
('Dr. Sarah Chen', 'MIT', 'Oncology, Structural Biology', 45, 'schen@mit.edu', 3, 127, '2019-09-01'),
('Dr. Michael Zhang', 'Stanford University', 'Condensed Matter Physics', 38, 'mzhang@stanford.edu', 2, 89, '2020-01-15'),
('Prof. Elena Rodriguez', 'Harvard Medical School', 'Computational Biology, AI', 52, 'erodriguez@hms.harvard.edu', 4, 201, '2017-07-01'),
('Dr. James Liu', 'UCSF', 'Microbiology, Antibiotic Discovery', 41, 'jliu@ucsf.edu', 3, 112, '2018-03-15'),
('Dr. Anna Kowalski', 'Johns Hopkins University', 'Neurology, Biomarkers', 33, 'akowalski@jhu.edu', 2, 78, '2021-01-01'),
('Dr. Robert Kim', 'Memorial Sloan Kettering', 'Immunotherapy, mRNA Vaccines', 47, 'rkim@mskcc.org', 2, 143, '2019-06-01'),
('Dr. Priya Patel', 'Caltech', 'Materials Science, Photovoltaics', 29, 'ppatel@caltech.edu', 1, 56, '2022-01-15'),
('Dr. Thomas Brown', 'Broad Institute', 'Gene Editing, CRISPR', 61, 'tbrown@broadinstitute.org', 3, 234, '2016-08-01'),
('Dr. Lisa Wang', 'UC Berkeley', 'Antibiotic Peptides, ML', 36, 'lwang@berkeley.edu', 1, 94, '2020-09-01'),
('Dr. Carlos Mendez', 'Salk Institute', 'Neuroscience, iPSC', 28, 'cmendez@salk.edu', 2, 48, '2022-06-01'),
('Dr. Yuki Tanaka', 'Argonne National Lab', 'Electrochemistry, Catalysis', 44, 'ytanaka@anl.gov', 2, 118, '2018-11-01'),
('Prof. David Lee', 'Weizmann Institute', 'Single Cell Genomics', 67, 'dlee@weizmann.ac.il', 1, 289, '2015-03-01'),
('Dr. Fatima Hassan', 'Allen Institute', 'AI, Drug Discovery', 22, 'fhassan@alleninstitute.org', 2, 34, '2023-01-15'),
('Dr. Nina Petrov', 'NIH', 'Immunology, Multiple Sclerosis', 31, 'npetrov@nih.gov', 2, 67, '2021-07-01'),
('Dr. Omar Al-Rashid', 'Pasteur Institute', 'Phage Biology, MDR Bacteria', 39, 'oalrashid@pasteur.fr', 2, 103, '2019-04-01');

-- Publications
INSERT INTO publications (project_id, title, journal, status, impact_factor, submitted_at, accepted_at, authors) VALUES
(1, 'Structural basis for allosteric inhibition of KRAS G12D: implications for combination therapy', 'Nature', 'published', 64.8, '2024-12-01', '2025-01-15', 'Chen S, Liu J, Rodriguez E'),
(3, 'Enhanced prediction of intrinsically disordered proteins using modified attention mechanisms', 'Nature Methods', 'published', 48.0, '2024-11-15', '2025-02-01', 'Rodriguez E, Brown T'),
(5, 'A plasma biomarker panel for early Alzheimer''s disease detection with superior sensitivity', 'The Lancet Neurology', 'under_review', 44.2, '2025-01-10', NULL, 'Kowalski A, Chen S, et al.'),
(6, 'Long neoantigen peptides elicit superior cytotoxic T lymphocyte responses in mRNA cancer vaccines', 'Nature Medicine', 'accepted', 82.9, '2024-10-01', '2025-02-15', 'Kim R, Hassan F'),
(4, 'Bacteriocin BM12 reveals novel lipid II binding mechanism active against carbapenem-resistant Enterobacteriaceae', 'Science', 'published', 56.9, '2024-11-01', '2025-01-20', 'Liu J, Wang L, Al-Rashid O'),
(9, 'Machine learning-guided antimicrobial peptide library enables discovery of 127 novel active compounds', 'Cell', 'published', 66.9, '2024-08-01', '2024-11-15', 'Wang L, Lee D, Hassan F'),
(10, 'Graph attention networks for drug repurposing: application to rare cancers', 'Nature Biotechnology', 'submitted', 54.9, '2025-02-01', NULL, 'Hassan F, Rodriguez E'),
(12, 'Single-cell transcriptomic atlas of the human pancreas at cellular resolution', 'Nature', 'published', 64.8, '2024-04-01', '2024-08-01', 'Lee D, et al.'),
(2, 'Room-temperature superconductivity in lanthanum hydrides: new synthesis approach', 'Physical Review Letters', 'draft', 9.0, NULL, NULL, 'Zhang M, Tanaka Y'),
(11, 'Copper single-atom catalysts achieve >75% Faradaic efficiency for CO2 reduction to ethylene', 'Nature Catalysis', 'submitted', 41.8, '2025-01-20', NULL, 'Tanaka Y, Zhang M'),
(8, 'Optimized nuclear localization signals reduce adenine base editor off-target effects', 'Nature Biotechnology', 'draft', 54.9, NULL, NULL, 'Brown T, Chen S'),
(14, 'Gut microbiome short-chain fatty acids mediate neuroinflammation via vagal signaling in multiple sclerosis', 'Brain', 'draft', 14.5, NULL, NULL, 'Petrov N, Mendez C'),
(15, 'Engineered bacteriophage tail fibers expand host range against multidrug-resistant Pseudomonas aeruginosa', 'Nature Microbiology', 'under_review', 34.8, '2025-01-05', NULL, 'Al-Rashid O, Liu J'),
(13, 'mRNA cancer vaccines targeting neoantigens: first-in-human phase I trial results', 'New England Journal of Medicine', 'accepted', 176.1, '2024-09-01', '2025-02-20', 'Kim R, Kowalski A, et al.'),
(6, 'Neural organoid modeling of Parkinson''s disease reveals mitochondrial dysfunction as universal feature', 'Cell Stem Cell', 'submitted', 24.6, '2025-01-25', NULL, 'Mendez C, Rodriguez E');

-- ============================================================================
-- AI-NATIVE DISCOVERY ENGINES — RETRIEVAL LAYER SEED DATA (audit pass)
-- ============================================================================

-- Corpora — real scientific corpora with realistic doc counts (snapshot 2026)
INSERT INTO corpora (slug, name, domain, source_url, license, doc_count, last_crawled_at, embedding_model, dim, notes) VALUES
('arxiv-cs',        'arXiv (cs.* categories)',          'computer_science', 'https://arxiv.org/list/cs',           'arXiv non-exclusive',    2840000, NOW() - INTERVAL '2 days',  'voyage-3-large',           1024, 'Includes cs.AI, cs.CL, cs.LG, cs.CV. Daily crawl.'),
('arxiv-bio',       'arXiv (q-bio.* + bioRxiv mirror)', 'biology',          'https://arxiv.org/list/q-bio',        'CC-BY / mixed',           485000, NOW() - INTERVAL '3 days',  'voyage-3-large',           1024, 'Includes q-bio + bioRxiv preprints.'),
('pubmed-baseline', 'PubMed MEDLINE baseline 2026',     'biomedical',       'https://pubmed.ncbi.nlm.nih.gov/',    'NLM public domain',     37200000, NOW() - INTERVAL '7 days',  'openai-text-embedding-3-large', 3072, 'Full MEDLINE baseline + daily updates.'),
('biorxiv',         'bioRxiv preprint server',           'biology',          'https://www.biorxiv.org/',            'CC-BY / CC0',             295000, NOW() - INTERVAL '1 day',   'BAAI/bge-large-en-v1.5',   1024, 'Live preprint mirror, daily refresh.'),
('chemrxiv',        'ChemRxiv chemistry preprints',      'chemistry',        'https://chemrxiv.org/',               'CC-BY',                    32400, NOW() - INTERVAL '2 days',  'BAAI/bge-large-en-v1.5',   1024, 'Open chemistry preprint server.'),
('medrxiv',         'medRxiv clinical preprints',        'clinical',         'https://www.medrxiv.org/',            'CC-BY / CC0',              68500, NOW() - INTERVAL '1 day',   'voyage-3-large',           1024, 'Clinical/health-sciences preprints.'),
('semantic-scholar','Semantic Scholar corpus (S2ORC)',   'multidisciplinary','https://www.semanticscholar.org/',    'ODC-BY 1.0',           215000000, NOW() - INTERVAL '14 days', 'cohere-embed-english-v3.0',1024, 'Full S2ORC; refreshed every two weeks.'),
('uspto-patents',   'USPTO patent grants 1976-2026',     'patents',          'https://patentsview.org/',            'USPTO public domain',   12800000, NOW() - INTERVAL '5 days',  'openai-text-embedding-3-large', 3072, 'Full-text patents + claims.'),
('clinicaltrials',  'ClinicalTrials.gov registry',       'clinical',         'https://clinicaltrials.gov/',         'NIH public domain',       485000, NOW() - INTERVAL '1 day',   'voyage-3-large',           1024, 'All registered trials.'),
('openalex',        'OpenAlex scholarly works',          'multidisciplinary','https://openalex.org/',               'CC0',                  245000000, NOW() - INTERVAL '10 days', 'BAAI/bge-large-en-v1.5',   1024, 'Open replacement for MAG.'),
('protein-pdb',     'RCSB PDB structural abstracts',     'structural_bio',   'https://www.rcsb.org/',               'CC0',                     220000, NOW() - INTERVAL '7 days',  'voyage-3-large',           1024, 'PDB entry abstracts + method sections.'),
('materials-cloud', 'Materials Cloud + OQMD',            'materials',        'https://materialscloud.org/',         'CC-BY-4.0',                85000, NOW() - INTERVAL '4 days',  'BAAI/bge-large-en-v1.5',   1024, 'Materials science computational records.')
ON CONFLICT (slug) DO NOTHING;

-- Corpus documents — real paper titles with arXiv / DOI IDs
INSERT INTO corpus_documents (corpus_id, external_id, doi, title, abstract, authors, venue, year, url, tokens, citation_count, has_embedding, bm25_doc_len) VALUES
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2005.11401', '10.48550/arXiv.2005.11401', 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', 'We introduce RAG, a hybrid parametric+non-parametric memory architecture that retrieves passages from Wikipedia and conditions a seq2seq model on them. RAG achieves SOTA on open-domain QA tasks.', 'Lewis P, Perez E, Piktus A, Petroni F, Karpukhin V, Goyal N, Küttler H, Lewis M, Yih W, Rocktäschel T, Riedel S, Kiela D', 'NeurIPS 2020', 2020, 'https://arxiv.org/abs/2005.11401', 9800, 6420, true, 9800),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:1810.04805', '10.48550/arXiv.1810.04805', 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', 'BERT is conceptually simple and empirically powerful. It obtains new state-of-the-art results on eleven natural language processing tasks.', 'Devlin J, Chang M-W, Lee K, Toutanova K', 'NAACL 2019', 2018, 'https://arxiv.org/abs/1810.04805', 11200, 92300, true, 11200),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2104.08663', '10.48550/arXiv.2104.08663', 'BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of Information Retrieval Models', 'BEIR is a heterogeneous benchmark covering nine IR tasks and 18 datasets. We benchmark ten retrieval methods including BM25, dense retrievers (DPR, ANCE) and late-interaction (ColBERT) in a zero-shot setting.', 'Thakur N, Reimers N, Rücklé A, Srivastava A, Gurevych I', 'NeurIPS 2021', 2021, 'https://arxiv.org/abs/2104.08663', 12400, 1840, true, 12400),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2210.07316', '10.48550/arXiv.2210.07316', 'MTEB: Massive Text Embedding Benchmark', 'MTEB spans 8 embedding tasks covering 58 datasets and 112 languages. We benchmark 33 models and provide the most comprehensive view of text embedding models to date.', 'Muennighoff N, Tazi N, Magne L, Reimers N', 'EACL 2023', 2022, 'https://arxiv.org/abs/2210.07316', 13900, 1120, true, 13900),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2004.04906', '10.48550/arXiv.2004.04906', 'Dense Passage Retrieval for Open-Domain Question Answering', 'DPR uses a dual-encoder framework to learn dense passage representations. It outperforms strong Lucene-BM25 by 9-19% absolute on top-20 retrieval accuracy.', 'Karpukhin V, Oguz B, Min S, Lewis P, Wu L, Edunov S, Chen D, Yih W', 'EMNLP 2020', 2020, 'https://arxiv.org/abs/2004.04906', 10500, 4980, true, 10500),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2004.12832', '10.48550/arXiv.2004.12832', 'ColBERT: Efficient and Effective Passage Search via Contextualized Late Interaction over BERT', 'ColBERT introduces a late-interaction architecture for BERT-based retrieval that is two orders of magnitude faster than re-ranking with BERT while maintaining quality.', 'Khattab O, Zaharia M', 'SIGIR 2020', 2020, 'https://arxiv.org/abs/2004.12832', 9700, 1980, true, 9700),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2112.09118', '10.48550/arXiv.2112.09118', 'Unsupervised Dense Information Retrieval with Contrastive Learning (Contriever)', 'Contriever uses contrastive learning on unsupervised data to achieve competitive zero-shot dense retrieval performance on BEIR.', 'Izacard G, Caron M, Hosseini L, Riedel S, Bojanowski P, Joulin A, Grave E', 'TMLR 2022', 2021, 'https://arxiv.org/abs/2112.09118', 9200, 1340, true, 9200),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2308.03281', '10.48550/arXiv.2308.03281', 'Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection', 'Self-RAG trains a single LM to adaptively retrieve passages on-demand and to self-critique its generation via reflection tokens.', 'Asai A, Wu Z, Wang Y, Sil A, Hajishirzi H', 'ICLR 2024', 2023, 'https://arxiv.org/abs/2308.03281', 10800, 612, true, 10800),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2310.11511', '10.48550/arXiv.2310.11511', 'RA-DIT: Retrieval-Augmented Dual Instruction Tuning', 'RA-DIT jointly fine-tunes the LM and the retriever via dual instruction tuning, lifting LLaMA-2 65B to 35.9 EM on KILT.', 'Lin X V, Chen X, Chen M, Shi W, et al.', 'ICLR 2024', 2023, 'https://arxiv.org/abs/2310.11511', 11500, 380, true, 11500),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2305.18290', '10.48550/arXiv.2305.18290', 'HyDE: Hypothetical Document Embeddings - Precise Zero-Shot Dense Retrieval without Relevance Labels', 'HyDE generates a hypothetical document with an instruction-following LM, embeds it with a contrastive encoder, and retrieves real documents matching that embedding.', 'Gao L, Ma X, Lin J, Callan J', 'ACL 2023', 2023, 'https://arxiv.org/abs/2212.10496', 7800, 845, true, 7800),
((SELECT id FROM corpora WHERE slug='pubmed-baseline'), 'PMID:34265844', '10.1056/NEJMoa2107454', 'BNT162b2 Vaccine Effectiveness against SARS-CoV-2 Delta Variant', 'In an observational study of >2 million individuals, BNT162b2 effectiveness against symptomatic Delta infection was 88% at two weeks after second dose.', 'Bernal J L, Andrews N, Gower C, Gallagher E, et al.', 'NEJM', 2021, 'https://pubmed.ncbi.nlm.nih.gov/34265844/', 4200, 5290, true, 4200),
((SELECT id FROM corpora WHERE slug='pubmed-baseline'), 'PMID:34265844', '10.1038/s41586-021-03819-2', 'Highly accurate protein structure prediction with AlphaFold', 'AlphaFold2 predicts the 3D structure of proteins from amino acid sequence with median backbone accuracy of 0.96 Å RMSD on the CASP14 dataset.', 'Jumper J, Evans R, Pritzel A, Green T, et al.', 'Nature', 2021, 'https://doi.org/10.1038/s41586-021-03819-2', 10500, 18200, true, 10500),
((SELECT id FROM corpora WHERE slug='pubmed-baseline'), 'PMID:32296183', '10.1126/science.abb7314', 'A pneumonia outbreak associated with a new coronavirus of probable bat origin', 'A novel coronavirus, SARS-CoV-2, was isolated from patients with severe pneumonia in Wuhan, China and shown to be 96.2% identical to a bat coronavirus.', 'Zhou P, Yang X-L, Wang X-G, Hu B, et al.', 'Nature', 2020, 'https://pubmed.ncbi.nlm.nih.gov/32296183/', 6800, 14500, true, 6800),
((SELECT id FROM corpora WHERE slug='biorxiv'), 'bioRxiv:2024.03.15', '10.1101/2024.03.15.585234', 'Engineered allosteric KRAS G12D inhibitors with sub-nanomolar potency', 'We describe MRTX-1719 analogs that bind a previously uncharacterized allosteric pocket of KRAS G12D with Ki of 0.4 nM in biochemical assays and complete tumor regression in PDX models.', 'Chen S, Park J H, Rodriguez E', 'bioRxiv', 2024, 'https://www.biorxiv.org/content/10.1101/2024.03.15.585234', 5500, 12, true, 5500),
((SELECT id FROM corpora WHERE slug='biorxiv'), 'bioRxiv:2025.01.08', '10.1101/2025.01.08.631122', 'Single-cell atlas of human pancreatic islets across 200 donors', 'We profile 1.2 million cells from 200 organ donors and identify three molecular subtypes of beta cells with distinct insulin secretion programs.', 'Lee D, Petrov N, Tanaka Y', 'bioRxiv', 2025, 'https://www.biorxiv.org/content/10.1101/2025.01.08.631122', 8200, 24, true, 8200),
((SELECT id FROM corpora WHERE slug='chemrxiv'), 'ChemRxiv:67a1f8c4', '10.26434/chemrxiv-2025-x9k4l', 'Copper single-atom catalysts on N-doped graphene for selective CO2-to-ethylene electroreduction at 80% Faradaic efficiency', 'We demonstrate Cu1-N4 single-atom sites achieving 80% Faradaic efficiency for ethylene at -1.0 V vs RHE with 100h stability.', 'Tanaka Y, Zhang M, Liu J', 'ChemRxiv', 2025, 'https://chemrxiv.org/engage/chemrxiv/article-details/67a1f8c4', 4900, 8, true, 4900),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2402.01680', '10.48550/arXiv.2402.01680', 'BGE M3-Embedding: Multi-Lingual, Multi-Functionality, Multi-Granularity Text Embeddings', 'BGE-M3 supports dense, lexical, and multi-vector retrieval in 100+ languages, outperforming OpenAI text-embedding-3-large on most MTEB tasks at a fraction of cost.', 'Chen J, Xiao S, Zhang P, Luo K, Lian D, Liu Z', 'arXiv', 2024, 'https://arxiv.org/abs/2402.03216', 11200, 410, true, 11200),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2407.19669', '10.48550/arXiv.2407.19669', 'Voyage AI Embeddings - voyage-3-large Technical Report', 'voyage-3-large achieves 75.4 average score on MTEB English while supporting 32K token context. It outperforms OpenAI text-embedding-3-large by 7.5% on retrieval tasks.', 'Voyage AI Research', 'arXiv', 2024, 'https://blog.voyageai.com/2024/09/18/voyage-3/', 8500, 95, true, 8500),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2309.07597', '10.48550/arXiv.2309.07597', 'C-Pack: Packaged Resources To Advance General Chinese Embedding (bge-large-en-v1.5)', 'BGE-large-en-v1.5 obtains 64.2 MTEB English average and is the strongest <1B-parameter open-source embedding model on BEIR retrieval at release time.', 'Xiao S, Liu Z, Zhang P, Muennighoff N', 'SIGIR 2024', 2023, 'https://arxiv.org/abs/2309.07597', 9300, 720, true, 9300),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2304.04675', '10.48550/arXiv.2304.04675', 'Cohere Rerank: rerank-3-multilingual', 'Cohere rerank-3-multilingual improves nDCG@10 by 12-25% over base BM25 across BEIR datasets at sub-100ms latency for re-ranking 100 candidates.', 'Cohere AI Research', 'Cohere Tech Report', 2024, 'https://cohere.com/blog/rerank-3', 5200, 42, true, 5200),
((SELECT id FROM corpora WHERE slug='clinicaltrials'), 'NCT05828043', NULL, 'A Phase 1 Study of MRTX-1719 in Advanced KRAS G12D-Mutated Solid Tumors', 'First-in-human dose escalation study of MRTX-1719 in patients with KRAS G12D-mutated pancreatic, colorectal and lung cancers. Primary endpoint: MTD/RP2D.', 'Mirati Therapeutics', 'ClinicalTrials.gov', 2023, 'https://clinicaltrials.gov/study/NCT05828043', 3200, 0, true, 3200),
((SELECT id FROM corpora WHERE slug='clinicaltrials'), 'NCT05537142', NULL, 'mRNA Personalized Neoantigen Vaccine in High-Risk Resected Melanoma', 'Randomized phase 2b trial evaluating mRNA-4157 + pembrolizumab vs pembrolizumab alone in stage III/IV resected melanoma. N=157.', 'Moderna / Merck', 'ClinicalTrials.gov', 2022, 'https://clinicaltrials.gov/study/NCT05537142', 2900, 0, true, 2900),
((SELECT id FROM corpora WHERE slug='arxiv-bio'), 'arXiv:2106.13189', '10.48550/arXiv.2106.13189', 'ESM-2 Language Models Enable Atomic-Level Structure Prediction', 'ESM-2 scales protein language models to 15B parameters and is the basis for ESMFold structure prediction with 1-order-of-magnitude faster inference than AlphaFold2.', 'Lin Z, Akin H, Rao R, Hie B, et al.', 'Science', 2022, 'https://www.science.org/doi/10.1126/science.ade2574', 11800, 2150, true, 11800),
((SELECT id FROM corpora WHERE slug='arxiv-cs'), 'arXiv:2310.06825', '10.48550/arXiv.2310.06825', 'Mistral 7B', 'Mistral 7B outperforms Llama 2 13B across all evaluated benchmarks. We release it under Apache 2.0.', 'Jiang A Q, Sablayrolles A, Mensch A, et al.', 'arXiv', 2023, 'https://arxiv.org/abs/2310.06825', 7400, 1340, true, 7400),
((SELECT id FROM corpora WHERE slug='openalex'), 'W4283749723', '10.1126/science.adi5639', 'CRISPR-Cas9 Base Editor Achieves <0.1% Off-Target Rate with Optimized NLS', 'Engineered ABE8e variants with bipartite SV40 + nucleoplasmin NLS achieve <0.1% off-target editing in primary T cells across 24 sites.', 'Brown T, Chen S, et al.', 'Science', 2024, 'https://www.science.org/doi/10.1126/science.adi5639', 6700, 89, true, 6700)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Benchmarks — real BEIR / MTEB / SciFact / NFCorpus tasks
-- ============================================================================
INSERT INTO benchmarks (slug, name, suite, domain, task_type, num_queries, num_docs, primary_metric, description) VALUES
('beir-nfcorpus',     'BEIR / NFCorpus',          'BEIR', 'medical',         'retrieval', 323,    3633,    'ndcg@10', 'Nutrition / medical IR. Small but high-precision relevance judgments.'),
('beir-scifact',      'BEIR / SciFact',           'BEIR', 'scientific',      'fact-check', 300,   5183,    'ndcg@10', 'Scientific claim verification against research abstracts.'),
('beir-trec-covid',   'BEIR / TREC-COVID',        'BEIR', 'biomedical',      'retrieval', 50,     171332,  'ndcg@10', 'TREC-COVID round 5 retrieval over CORD-19 corpus.'),
('beir-bioasq',       'BEIR / BioASQ',            'BEIR', 'biomedical',      'retrieval', 500,    14914602,'ndcg@10', 'Biomedical QA over PubMed.'),
('beir-fiqa',         'BEIR / FiQA-2018',         'BEIR', 'finance',         'retrieval', 648,    57638,   'ndcg@10', 'Financial opinion QA.'),
('beir-nq',           'BEIR / NaturalQuestions',  'BEIR', 'open_domain',     'retrieval', 3452,   2681468, 'ndcg@10', 'Natural Questions over Wikipedia.'),
('beir-hotpotqa',     'BEIR / HotpotQA',          'BEIR', 'multi_hop',       'retrieval', 7405,   5233329, 'ndcg@10', 'Multi-hop question answering.'),
('mteb-arguana',      'MTEB / ArguAna',           'MTEB', 'argumentation',   'retrieval', 1406,   8674,    'ndcg@10', 'Counter-argument retrieval.'),
('mteb-touche2020',   'MTEB / Touché-2020',       'MTEB', 'argumentation',   'retrieval', 49,     382545,  'ndcg@10', 'Controversial-question argument retrieval.'),
('mteb-quora',        'MTEB / QuoraDuplicateQ',   'MTEB', 'paraphrase',      'retrieval', 10000,  522931,  'ndcg@10', 'Duplicate question retrieval on Quora.'),
('mteb-msmarco',      'MTEB / MS MARCO passage',  'MTEB', 'web',             'retrieval', 6980,   8841823, 'mrr@10',  'MS MARCO passage ranking dev split.'),
('scidocs',           'SciDocs (BEIR)',           'BEIR', 'scientific',      'retrieval', 1000,   25657,   'ndcg@10', 'Scientific paper recommendation tasks.'),
('lotte-science',     'LoTTE-Science (test pooled)','LoTTE','scientific',    'retrieval', 1839,   1694164, 'success@5','StackExchange long-tail retrieval, science split.')
ON CONFLICT (slug) DO NOTHING;

-- Benchmark runs — realistic published numbers
INSERT INTO benchmark_runs (benchmark_id, retriever, embedding_model, reranker_model, alpha, ndcg_at_10, recall_at_100, mrr, map_score, latency_p50_ms, latency_p95_ms, cost_per_1k_usd, notes) VALUES
((SELECT id FROM benchmarks WHERE slug='beir-nfcorpus'),    'BM25',                  NULL,                          NULL,                            NULL, 0.3253, 0.2606, 0.5070, 0.1612, 18,  42,  0.0000, 'Anserini Lucene BM25 (k1=0.9, b=0.4).'),
((SELECT id FROM benchmarks WHERE slug='beir-nfcorpus'),    'dense',                 'BAAI/bge-large-en-v1.5',      NULL,                            NULL, 0.3743, 0.3120, 0.5810, 0.1820, 38,  88,  0.0030, 'bge-large-en-v1.5 zero-shot.'),
((SELECT id FROM benchmarks WHERE slug='beir-nfcorpus'),    'hybrid-rrf',            'BAAI/bge-large-en-v1.5',      'cohere-rerank-3',               0.50, 0.4187, 0.3540, 0.6310, 0.2050, 142, 285, 0.0420, 'BM25+dense RRF fusion + Cohere rerank top-100.'),
((SELECT id FROM benchmarks WHERE slug='beir-nfcorpus'),    'hybrid-rrf',            'voyage-3-large',              'voyage-rerank-2',               0.50, 0.4392, 0.3680, 0.6510, 0.2180, 168, 325, 0.0510, 'Voyage stack on NFCorpus.'),
((SELECT id FROM benchmarks WHERE slug='beir-scifact'),     'BM25',                  NULL,                          NULL,                            NULL, 0.6789, 0.9250, 0.7280, 0.6520, 22,  55,  0.0000, 'BM25 baseline on SciFact.'),
((SELECT id FROM benchmarks WHERE slug='beir-scifact'),     'dense',                 'BAAI/bge-large-en-v1.5',      NULL,                            NULL, 0.7400, 0.9420, 0.7920, 0.7180, 41,  92,  0.0030, 'bge-large zero-shot.'),
((SELECT id FROM benchmarks WHERE slug='beir-scifact'),     'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.55, 0.7920, 0.9560, 0.8420, 0.7690, 155, 305, 0.0480, 'Best published config on SciFact.'),
((SELECT id FROM benchmarks WHERE slug='beir-trec-covid'),  'BM25',                  NULL,                          NULL,                            NULL, 0.6557, 0.4980, 0.8920, 0.3210, 28,  72,  0.0000, 'TREC-COVID BM25.'),
((SELECT id FROM benchmarks WHERE slug='beir-trec-covid'),  'dense',                 'voyage-3-large',              NULL,                            NULL, 0.7180, 0.5610, 0.9150, 0.3580, 52,  118, 0.0040, 'voyage-3-large on TREC-COVID.'),
((SELECT id FROM benchmarks WHERE slug='beir-trec-covid'),  'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.55, 0.7910, 0.6280, 0.9410, 0.4120, 198, 410, 0.0530, 'Hybrid+rerank, near SOTA.'),
((SELECT id FROM benchmarks WHERE slug='beir-bioasq'),      'BM25',                  NULL,                          NULL,                            NULL, 0.4226, 0.5610, 0.4920, 0.2350, 65,  148, 0.0000, 'BioASQ BM25 over MEDLINE.'),
((SELECT id FROM benchmarks WHERE slug='beir-bioasq'),      'dense',                 'openai-text-embedding-3-large', NULL,                          NULL, 0.4810, 0.6210, 0.5340, 0.2680, 85,  178, 0.0130, 'OpenAI 3-large on BioASQ.'),
((SELECT id FROM benchmarks WHERE slug='beir-bioasq'),      'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.55, 0.5390, 0.6710, 0.5910, 0.3010, 235, 480, 0.0560, 'Hybrid + rerank on BioASQ.'),
((SELECT id FROM benchmarks WHERE slug='beir-nq'),          'BM25',                  NULL,                          NULL,                            NULL, 0.3055, 0.7600, 0.3620, 0.2540, 35,  88,  0.0000, 'NQ BM25.'),
((SELECT id FROM benchmarks WHERE slug='beir-nq'),          'dense',                 'BAAI/bge-large-en-v1.5',      NULL,                            NULL, 0.5410, 0.8810, 0.5980, 0.4710, 48,  110, 0.0030, 'bge-large on NQ.'),
((SELECT id FROM benchmarks WHERE slug='beir-nq'),          'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.45, 0.6210, 0.9020, 0.6810, 0.5310, 175, 340, 0.0490, 'Hybrid+rerank on NQ.'),
((SELECT id FROM benchmarks WHERE slug='beir-hotpotqa'),    'BM25',                  NULL,                          NULL,                            NULL, 0.6030, 0.7400, 0.6510, 0.4920, 42,  105, 0.0000, 'HotpotQA BM25.'),
((SELECT id FROM benchmarks WHERE slug='beir-hotpotqa'),    'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.50, 0.7480, 0.8410, 0.8120, 0.6420, 215, 425, 0.0510, 'Hybrid+rerank on HotpotQA.'),
((SELECT id FROM benchmarks WHERE slug='mteb-arguana'),     'dense',                 'BAAI/bge-large-en-v1.5',      NULL,                            NULL, 0.6361, 0.9920, 0.7180, 0.5910, 36,  82,  0.0030, 'bge-large on ArguAna.'),
((SELECT id FROM benchmarks WHERE slug='mteb-msmarco'),     'BM25',                  NULL,                          NULL,                            NULL, 0.2280, 0.6810, 0.2360, 0.1820, 12,  28,  0.0000, 'MS MARCO BM25 baseline.'),
((SELECT id FROM benchmarks WHERE slug='mteb-msmarco'),     'dense',                 'openai-text-embedding-3-large', NULL,                          NULL, 0.4290, 0.8120, 0.4380, 0.3210, 78,  165, 0.0130, 'OpenAI 3-large on MS MARCO.'),
((SELECT id FROM benchmarks WHERE slug='scidocs'),          'BM25',                  NULL,                          NULL,                            NULL, 0.1581, 0.3560, 0.2710, 0.0820, 22,  58,  0.0000, 'SciDocs BM25.'),
((SELECT id FROM benchmarks WHERE slug='scidocs'),          'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.50, 0.2390, 0.4710, 0.3920, 0.1340, 158, 320, 0.0490, 'Best hybrid on SciDocs.'),
((SELECT id FROM benchmarks WHERE slug='lotte-science'),    'BM25',                  NULL,                          NULL,                            NULL, 0.5810, 0.7240, 0.6420, 0.4910, 25,  62,  0.0000, 'LoTTE-Science BM25 success@5.'),
((SELECT id FROM benchmarks WHERE slug='lotte-science'),    'hybrid-rrf',            'voyage-3-large',              'cohere-rerank-3',               0.50, 0.7320, 0.8410, 0.7910, 0.6510, 180, 360, 0.0480, 'Hybrid+rerank on LoTTE.')
ON CONFLICT DO NOTHING;


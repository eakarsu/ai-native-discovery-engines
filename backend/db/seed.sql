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

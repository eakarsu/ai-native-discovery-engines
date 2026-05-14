const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Realistic scientific R&D sample data, scoped to schema.sql entities.
// Each generator inserts 5-10 rows. FK relationships are resolved at runtime
// from existing parent ids, so order of seeding does not matter.

const PROJECTS = [
  ['Room-Temperature Superconductors in Lanthanum Hydrides','Condensed Matter Physics','Reproduce LaH10 near-ambient superconductivity at lower pressures','active','Dr. Mikhail Eremets','2024-03-15',12,2],
  ['CRISPR-Cas13 Diagnostics for Emerging Pathogens','Molecular Biology','15-minute isothermal RNA detection for novel respiratory viruses','active','Dr. Jennifer Doudna','2024-01-08',24,3],
  ['Solid-State Lithium Metal Batteries','Materials Science','Achieve >500 Wh/kg with garnet-type LLZO electrolytes and >1000 cycles','active','Dr. Yet-Ming Chiang','2023-09-01',31,1],
  ['Protein Folding via AlphaFold-Style Diffusion','Computational Biology','Benchmark structure prediction for intrinsically disordered regions','completed','Dr. John Jumper','2023-04-20',47,4],
  ['Neural Decoding of Speech in Locked-In Patients','Neuroscience','Decode imagined speech from Utah-array recordings at >60 WPM','active','Dr. Edward Chang','2024-05-12',8,1],
  ['Fusion Plasma Stabilization with Reinforcement Learning','Plasma Physics','RL controllers for tokamak shape control on the TCV reactor','active','Dr. Federico Felici','2024-02-01',19,2],
  ['Single-Cell Atlas of the Human Hypothalamus','Genomics','Cell-type heterogeneity across 12 hypothalamic nuclei','active','Dr. Aviv Regev','2024-06-10',6,0],
  ['Direct Air Capture with MOF-Based Sorbents','Chemistry','CO2 capture below $100/ton using next-generation MOFs','paused','Dr. Omar Yaghi','2023-11-15',14,1],
];

const RESEARCHERS = [
  ['Dr. Jennifer Doudna','UC Berkeley','CRISPR / RNA Biology',142,'jdoudna@berkeley.edu',4,312,'2018-09-01'],
  ['Dr. Demis Hassabis','Google DeepMind','AI for Science',96,'demis@deepmind.com',6,178,'2020-01-15'],
  ['Dr. Frances Arnold','Caltech','Directed Evolution',128,'frances@caltech.edu',3,264,'2017-03-10'],
  ['Dr. Katalin Kariko','University of Pennsylvania','mRNA Therapeutics',88,'kariko@upenn.edu',2,145,'2019-06-22'],
  ['Dr. Carolyn Bertozzi','Stanford University','Bioorthogonal Chemistry',134,'bertozzi@stanford.edu',5,287,'2016-11-04'],
  ['Dr. Yann LeCun','NYU / Meta AI','Deep Learning',158,'yann@cs.nyu.edu',7,401,'2015-02-18'],
  ['Dr. Emmanuelle Charpentier','Max Planck Institute','Microbiology / CRISPR',105,'charpentier@mpi.de',3,198,'2018-04-09'],
  ['Dr. David Baker','University of Washington','Protein Design',167,'dabaker@uw.edu',8,512,'2014-08-12'],
  ['Dr. Fei-Fei Li','Stanford University','Computer Vision / AI',121,'feifeili@stanford.edu',6,234,'2017-09-30'],
  ['Dr. Svante Paabo','Max Planck Institute','Paleogenomics',119,'paabo@mpi-leipzig.de',2,211,'2016-05-25'],
];

const HYPOTHESES = [
  ['Doping LaH10 with yttrium lowers the critical pressure for superconductivity below 100 GPa while preserving Tc above 250 K.',0.62,'proposed','DFT predicts similar DOS at the Fermi level for Y-doped variants.','Synthesis above 150 GPa has historically been irreproducible.','human'],
  ['An RL policy trained on TCV plasma traces generalizes zero-shot to ITER-scale geometries with <15% degradation.',0.41,'testing','Domain randomization in robotics shows analogous transfer.','Plasma turbulence scaling is poorly captured by current simulators.','ai'],
  ['Ultra-low-field MRI at 6.5 mT can detect ischemic stroke within 3 minutes using deep-learned reconstruction.',0.78,'supported','Pilot study at MGH showed 0.91 AUC on N=87 patients.',null,'human'],
  ['Imagined-speech decoding from motor cortex outperforms auditory-cortex decoding by >2x for sentence reconstruction.',0.55,'testing','Articulatory representations in M1 are richer in temporal structure.','Recent ECoG work suggests STG carries comparable information.','ai'],
  ['Diffusion-based protein design yields higher-binding mini-binders than RFdiffusion baselines for SARS-CoV-2 RBD.',0.68,'proposed','In silico binding affinity for diffusion designs is 1.4x lower Kd.','Wet-lab validation rates lag in silico predictions historically.','ai'],
  ['Garnet-type LLZO with Al doping suppresses dendrite formation at current densities up to 2 mA/cm^2.',0.59,'testing','Grain-boundary engineering reduced dendrite penetration in pilot cells.','Long-term cycling beyond 500 cycles remains untested.','human'],
  ['Single-cell transcriptomics of the arcuate nucleus reveals at least 3 previously uncharacterized neuropeptide-producing cell types.',0.72,'supported','Preliminary clustering of 42k cells shows 3 unannotated clusters.',null,'human'],
];

const EXPERIMENTS = [
  ['Diamond Anvil Cell Pressure Sweep on Y-LaH10','Synthesize Y-doped lanthanum hydride at 80, 100, 120, 150 GPa','Laser-heat at 1800 K; measure resistance vs T from 4 K to 300 K','running','2024-04-02',null,null],
  ['TCV RL Controller Live Plasma Test','Deploy trained PPO policy for shape control over 30 plasma shots','Compare against PID baseline on elongation tracking error','completed','2024-03-10','2024-03-25','PPO reduced RMS error by 41% vs PID baseline'],
  ['Ultra-Low-Field MRI Stroke Pilot','Image 100 ED patients with suspected stroke at 6.5 mT','Compare DL reconstruction vs 1.5T ground truth (DWI)','running','2024-02-15',null,null],
  ['Mini-Binder Library Screening for Spike RBD','Yeast display of 12,000 diffusion-designed mini-binders','Sort top 0.1% by Kd via FACS; validate by SPR','designed',null,null,null],
  ['LLZO Symmetric-Cell Cycling at 2 mA/cm^2','Cycle Li | LLZO-Al | Li cells at 25 C and 60 C','Track voltage vs time; image post-mortem with cryo-FIB','running','2024-05-01',null,null],
  ['Arcuate scRNA-seq with Spatial Validation','10x Chromium on 8 mouse hypothalami; MERFISH on adjacent sections','Cluster, annotate, and spatially register with MERFISH','completed','2024-01-15','2024-04-30','Identified 3 novel POMC+ subtypes'],
  ['Imagined-Speech BCI Decoding Sessions','5 ALS patients with Utah arrays in M1; 50 sessions of imagined speech','Train recurrent decoder; evaluate WER on held-out blocks','running','2024-06-01',null,null],
];

const RESULTS = [
  ['positive',97.20,true,'PPO controller cut elongation RMS error from 4.2cm to 2.5cm across 30 shots.','RL plasma control is viable for tokamak shape regulation; transfer plan to MAST-U is justified.',true,'2024-04-15'],
  ['positive',93.50,true,'3 novel POMC+ subtypes identified, each with distinct neuropeptide co-expression.','The arcuate nucleus contains previously unappreciated neuroendocrine cell-type diversity.',true,'2024-05-20'],
  ['negative',62.10,false,'Mini-binder Kd improved by 1.2x but failed in vivo neutralization assay.','Diffusion designs need wet-lab co-optimization; in silico Kd is a weak proxy for neutralization.',false,null],
  ['inconclusive',71.40,false,'DL reconstruction achieved 0.89 AUC but 4 false positives in N=100.','6.5 mT stroke screening is promising but requires larger N for sensitivity targets.',false,null],
  ['positive',95.80,true,'LaH10:Y showed Tc=255 K at 110 GPa across 4 of 6 cells.','Y-doping appears to reduce required pressure; needs independent replication at another facility.',false,null],
  ['positive',88.90,false,'LLZO-Al cells survived 320 cycles at 2 mA/cm^2 before short.','Al doping helps but does not solve dendrites at high current densities.',false,null],
];

const PUBLICATIONS = [
  ['Reinforcement-Learning Plasma Shape Control on TCV','Nature','published',49.962,'2024-03-30','2024-06-12','Felici F., Hassabis D., et al.'],
  ['A Single-Cell Atlas of the Murine Hypothalamic Arcuate Nucleus','Cell','accepted',64.500,'2024-05-10','2024-08-22','Regev A., Paabo S., et al.'],
  ['Yttrium-Doped Lanthanum Hydride: Pressure-Reduced High-Tc Superconductivity','Science','submitted',56.900,'2024-07-01',null,'Eremets M., Chiang Y.-M., et al.'],
  ['Deep-Learned Reconstruction for Portable Ultra-Low-Field Stroke MRI','The Lancet Digital Health','published',23.800,'2024-02-01','2024-04-18','Chang E., Doudna J., et al.'],
  ['Diffusion Models for De Novo Mini-Binder Design Against SARS-CoV-2','Nature Biotechnology','draft',46.900,null,null,'Baker D., Jumper J., et al.'],
  ['CRISPR-Cas13 Isothermal Diagnostics: 15-Minute Detection of Respiratory Viruses','Cell Host & Microbe','published',30.300,'2024-01-20','2024-05-05','Doudna J., Charpentier E., Kariko K.'],
  ['Aluminum-Doped LLZO Solid Electrolytes for Dendrite-Resistant Li Anodes','Joule','accepted',39.800,'2024-04-12','2024-07-30','Chiang Y.-M., Bertozzi C., et al.'],
];

async function pickIds(table, n) {
  const r = await pool.query(`SELECT id FROM ${table} ORDER BY id`);
  if (!r.rows.length) return [];
  const ids = r.rows.map((row) => row.id);
  const out = [];
  for (let i = 0; i < n; i++) out.push(ids[i % ids.length]);
  return out;
}

async function insertProjects() {
  let n = 0;
  for (const p of PROJECTS) {
    await pool.query(
      'INSERT INTO projects (name,domain,goal,status,lead_researcher,start_date,iteration_count,breakthrough_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      p,
    );
    n++;
  }
  return n;
}

async function insertResearchers() {
  let n = 0;
  for (const r of RESEARCHERS) {
    await pool.query(
      'INSERT INTO researchers (name,institution,specialization,h_index,email,active_projects,publications_count,joined_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      r,
    );
    n++;
  }
  return n;
}

async function insertHypotheses() {
  const projectIds = await pickIds('projects', HYPOTHESES.length);
  if (!projectIds.length) {
    const err = new Error('No projects exist. Insert sample projects first.');
    err.statusCode = 400;
    throw err;
  }
  let n = 0;
  for (let i = 0; i < HYPOTHESES.length; i++) {
    const h = HYPOTHESES[i];
    await pool.query(
      'INSERT INTO hypotheses (project_id,statement,confidence_score,status,supporting_evidence,contradicting_evidence,generated_by) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [projectIds[i], ...h],
    );
    n++;
  }
  return n;
}

async function insertExperiments() {
  const hypIds = await pickIds('hypotheses', EXPERIMENTS.length);
  if (!hypIds.length) {
    const err = new Error('No hypotheses exist. Insert sample hypotheses first.');
    err.statusCode = 400;
    throw err;
  }
  let n = 0;
  for (let i = 0; i < EXPERIMENTS.length; i++) {
    const e = EXPERIMENTS[i];
    await pool.query(
      'INSERT INTO experiments (hypothesis_id,title,design,methodology,status,started_at,completed_at,result_summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [hypIds[i], ...e],
    );
    n++;
  }
  return n;
}

async function insertResults() {
  const expIds = await pickIds('experiments', RESULTS.length);
  if (!expIds.length) {
    const err = new Error('No experiments exist. Insert sample experiments first.');
    err.statusCode = 400;
    throw err;
  }
  let n = 0;
  for (let i = 0; i < RESULTS.length; i++) {
    const r = RESULTS[i];
    await pool.query(
      'INSERT INTO results (experiment_id,outcome,significance_pct,breakthrough,data_summary,conclusion,published,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [expIds[i], ...r],
    );
    n++;
  }
  return n;
}

async function insertPublications() {
  const projectIds = await pickIds('projects', PUBLICATIONS.length);
  if (!projectIds.length) {
    const err = new Error('No projects exist. Insert sample projects first.');
    err.statusCode = 400;
    throw err;
  }
  let n = 0;
  for (let i = 0; i < PUBLICATIONS.length; i++) {
    const p = PUBLICATIONS[i];
    await pool.query(
      'INSERT INTO publications (project_id,title,journal,status,impact_factor,submitted_at,accepted_at,authors) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [projectIds[i], ...p],
    );
    n++;
  }
  return n;
}

const HANDLERS = {
  projects: insertProjects,
  researchers: insertResearchers,
  hypotheses: insertHypotheses,
  experiments: insertExperiments,
  results: insertResults,
  publications: insertPublications,
};

router.post('/sample-data/:entity', async (req, res) => {
  const { entity } = req.params;
  const handler = HANDLERS[entity];
  if (!handler) {
    return res.status(400).json({ error: `Unknown entity: ${entity}. Valid: ${Object.keys(HANDLERS).join(', ')}` });
  }
  try {
    const inserted = await handler();
    res.json({ inserted, entity });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// Convenience listing of available sample-data entities (for the FE page).
router.get('/sample-data', (_req, res) => {
  res.json({
    entities: Object.keys(HANDLERS).map((k) => ({
      entity: k,
      count: ({
        projects: PROJECTS.length,
        researchers: RESEARCHERS.length,
        hypotheses: HYPOTHESES.length,
        experiments: EXPERIMENTS.length,
        results: RESULTS.length,
        publications: PUBLICATIONS.length,
      })[k],
    })),
  });
});

module.exports = router;

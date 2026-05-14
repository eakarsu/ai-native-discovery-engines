DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS publications CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS experiments CASCADE;
DROP TABLE IF EXISTS hypotheses CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS researchers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(100),
  goal TEXT,
  status VARCHAR(20) DEFAULT 'active',
  lead_researcher VARCHAR(255),
  start_date DATE,
  iteration_count INTEGER DEFAULT 0,
  breakthrough_count INTEGER DEFAULT 0
);

CREATE TABLE hypotheses (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  confidence_score DECIMAL(4,3),
  status VARCHAR(20) DEFAULT 'proposed',
  supporting_evidence TEXT,
  contradicting_evidence TEXT,
  generated_by VARCHAR(20) DEFAULT 'human',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE experiments (
  id SERIAL PRIMARY KEY,
  hypothesis_id INTEGER REFERENCES hypotheses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  design TEXT,
  methodology TEXT,
  status VARCHAR(20) DEFAULT 'designed',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  result_summary TEXT
);

CREATE TABLE results (
  id SERIAL PRIMARY KEY,
  experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
  outcome VARCHAR(20),
  significance_pct DECIMAL(5,2),
  breakthrough BOOLEAN DEFAULT FALSE,
  data_summary TEXT,
  conclusion TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP
);

CREATE TABLE researchers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  institution VARCHAR(255),
  specialization VARCHAR(255),
  h_index INTEGER DEFAULT 0,
  email VARCHAR(255),
  active_projects INTEGER DEFAULT 0,
  publications_count INTEGER DEFAULT 0,
  joined_date DATE
);

CREATE TABLE publications (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  journal VARCHAR(255),
  status VARCHAR(20) DEFAULT 'draft',
  impact_factor DECIMAL(6,3),
  submitted_at DATE,
  accepted_at DATE,
  authors TEXT
);

CREATE TABLE activity_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

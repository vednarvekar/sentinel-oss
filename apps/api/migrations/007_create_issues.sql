CREATE TABLE IF NOT EXISTS issues (
  id BIGINT PRIMARY KEY,                    -- GitHub issue ID
  repo_id UUID REFERENCES repos(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  state TEXT,
  labels JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS issue_analysis (
  issue_id BIGINT PRIMARY KEY REFERENCES issues(id) ON DELETE CASCADE,
  likely_paths TEXT[],
  difficulty TEXT,
  confidence_score FLOAT,
  explanation TEXT,
  analyzed_at TIMESTAMP
);

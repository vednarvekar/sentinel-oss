CREATE TABLE if NOT EXISTS repos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    default_branch TEXT,
    ingested_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (owner, name)
);

CREATE TABLE if NOT EXISTS repo_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID NOT NULL REFERENCES repos(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    extension TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
ALTER TABLE repo_files
ADD CONSTRAINT repo_files_unique_repo_path
UNIQUE (repo_id, path);
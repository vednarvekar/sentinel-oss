import path from "node:path";
import { db } from "./client.js";

export const createOrUpdateRepo = async(owner: string, name: string, defaultBranch: string) => {
    const result = await db.query(
        `INSERT INTO repos (owner, name, default_branch, ingested_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (owner, name)
        DO UPDATE SET ingested_at = NOW(), default_branch = EXCLUDED.default_branch
        RETURNING id`,
        [owner, name, defaultBranch]
    );
    return result.rows[0].id;
};

export const saveRepoFiles = async(repoId: string, files: {path:string; extension: string | null}[]) => {
    if (files.length === 0) return;

    const values: any[] =[];
    const placeholders = files.map((file, i) => {
        const offset = i * 3;
        values.push(repoId, file.path, file.extension);

        return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    }).join(",");

    const query = `
    INSERT INTO repo_files (repo_id, path, extension)
    VALUES ${placeholders}
    ON CONFLICT (repo_id, path) DO NOTHING`;
    
    await db.query(query, values);
};

export const getRepoByOwnerAndName = async(owner: string, name: string) => {
    const result = await db.query(`
        SELECT id, owner, name, default_branch, ingested_at 
        FROM repos
        WHERE owner = $1 AND name = $2`,
        [owner, name]
    );
    return result.rows[0] ?? null;
};

export const getRepoFileCount = async (repoId: string) => {
  const res = await db.query(
    "SELECT COUNT(*) FROM repo_files WHERE repo_id = $1",
    [repoId]
  );
  return Number(res.rows[0].count);
};

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

export const saveRepoFiles = async(
    repoId: string,
    fetchedFiles: {
        path: string;
        extension: string | null; 
        imports: string[];
        urls: string[];
        content: string;
    }[]
) => {
    if (fetchedFiles.length === 0) return;

    const values: any[] =[];
    const placeholders = fetchedFiles.map((file, i) => {
        const offset = i * 6;
        values.push(
            repoId, 
            file.path, 
            file.extension, 
            JSON.stringify(file.imports), 
            JSON.stringify(file.urls), 
            JSON.stringify(file.content)
        )
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6})`;
    }).join(",");

    const query = `
    INSERT INTO repo_files (repo_id, path, extension, imports, urls, content)
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

// export const updateFileContent = async (repoId: string, path: string, content: string) => {
//     await db.query(
//         "UPDATE repo_files SET content = $1, last_fetched_at = NOW() WHERE repo_id = $2 AND path = $3",
//         [content, repoId, path]
//     );
// };
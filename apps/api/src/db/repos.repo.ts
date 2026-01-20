import { db } from "./client.js";

export const createOrUpdateRepo = async(owner: string, name: string, defaultBranch: string) => {
    const result = await db.query(
        `INSERT INTO repos (owner, name, default_branch, ingested_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (owner, name)
        DO UPDATE SET ingested_at = NOW()
        RETURNING id`,
        [owner, name, defaultBranch]
    );
    return result.rows[0].id;
};

export const saveRepoFiles = async(repoId: string, files: {path:string; extension: string | null}[]) => {
    for(const file of files) await db.query(
        `INSERT INTO`
    )
}
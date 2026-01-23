import { db } from "./client.js";

export const getUserById = async(id: string) => {
    const result = await db.query(
        `SELECT id, github_token FROM users WHERE id = $1`,
        [id]
    )
    return result.rows[0] ?? null;
}

export const getUserByGithubId = async(githubId: string) => {
    const result = await db.query(
        "SELECT id, github_id, username, avatar_url FROM users WHERE github_id = $1",
        [githubId]
    )
    return result.rows[0] ?? null;
}

export const createUserFromGithub = async(
    githubId: number, 
    username: string, 
    avatar_url: string, 
    githubToken: string
) => {
    const result = await db.query(
        `INSERT INTO users (github_id, username, avatar_url, github_token) VALUES ($1, $2, $3, $4) 
        ON CONFLICT (github_id) 
        DO UPDATE SET 
            username = EXCLUDED.username, 
            avatar_url = EXCLUDED.avatar_url, 
            github_token = EXCLUDED.github_token

        RETURNING id, github_id, username, avatar_url`,
        [githubId, username, avatar_url, githubToken]
    )
    return result.rows[0];
}
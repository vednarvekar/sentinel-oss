import { db } from "./client.js";

export const getUserByGithubId = async(githubId: string) => {
    const result = await db.query(
        "SELECT id, github_id, username, avatar_url FROM users WHERE github_id = $1"
    )
    return result.rows[0] ?? null;
}

export const createUserFromGithub = async(githubId: number, username: string, avatar_url: string) => {
    const result = await db.query(
        "INSERT INTO users (github_id, username, avatar_url) VALUES ($1, $2, $3) RETURNING id, github_id, username, avatar_url",
        [githubId, username, avatar_url]
    )
    return result.rows[0];
}
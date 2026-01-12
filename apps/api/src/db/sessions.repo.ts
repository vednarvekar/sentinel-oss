import {db} from './client.js'

export const createSession = async(userId: string, expiresAt: Date) => {

    const result = await db.query(
        "INSERT INTO sessions (user_id, expires_at) VALUES ($1, $2) RETURNING id, user_id, expires_at",
        [userId, expiresAt]
    )
    
    return result.rows[0];
}

export const getValidSession = async(sessionId: string) => {

    const result = await db.query(
        "SELECT id, user_id, expires_at FROM sessions WHERE id = $1 and expires_at > now()",
        [sessionId]
    )
    return result.rows[0];
}

export const deleteSession = async(sessionId: string) => {

    await db.query(
        "DELETE FROM sessions WHERE id = $1",
        [sessionId]
    )
}
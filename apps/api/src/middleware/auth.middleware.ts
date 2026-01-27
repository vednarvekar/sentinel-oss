import { verifyToken } from "../utils/jwt.js";
import { getValidSession } from "../db/sessions.repo.js";
import { getUserById } from "../db/user.repo.js";
import { FastifyRequest, FastifyReply } from "fastify";

// export const requireAuth = async(request: FastifyRequest, reply: FastifyReply) => {
    
export const requireAuth = async (request: FastifyRequest, reply: FastifyReply) => {

    const authHeader = request.headers.authorization;
    const cookieToken = request.cookies.accessToken;

    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
    } 
    else if (cookieToken) {
        token = cookieToken;
    }

    if (!token) {
        return reply.status(401).send({ error: "Unauthorized: Missing Token" });
    }

    try {
        const { userId, sessionId } = verifyToken(token);

        const session = await getValidSession(sessionId);
        if (!session) {
            return reply.status(401).send({ error: 'Session is invalid or expired' });
        }

        const user = await getUserById(userId);
        if (!user) {
            return reply.status(401).send({ error: "User not found" });
        }

        request.user = {
            id: user.id,
            githubToken: user.github_token,
        };
    } catch (err) {
        return reply.status(401).send({ error: "Invalid or malformed token" });
    }
};
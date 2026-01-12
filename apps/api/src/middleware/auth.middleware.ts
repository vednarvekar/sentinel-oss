import { verifyToken } from "../utils/jwt.js";
import { getValidSession } from "../db/sessions.repo.js";
import { FastifyRequest, FastifyReply } from "fastify";

export const requireAuth = async(request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;

    if(!header) {
        throw new Error("Missing Authorization Header");
    }

    if(!header.startsWith("Bearer ")){
        throw new Error("Missing Authorization Bearer");
    }

    const token = header.substring(7);
    const {userId, sessionId} = verifyToken(token);

    const session = await getValidSession(sessionId);
    if (!session) {
        throw new Error('Session is invalid or expired');
    }

    request.user = {id: userId};

}
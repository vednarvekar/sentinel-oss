import { FastifyInstance } from "fastify";
import { redis } from "../utils/redis.js";
import { repoSearchQueue } from "../jobs/queues.js";


export async function repoRoutes(server: FastifyInstance){
    server.get("/repos/search", async(request, reply) => {
        const {q} = request.query as {q?:string};

        if(!q) {
            return reply.status(400).send({error: "Missing Query"})
        }

        const cacheKey = `repo:search:${q}`;

        const cached = await redis.get(cacheKey);
        if(cached){
            return {
                status: "ready",
                source: "cache",
                data: JSON.parse(cached),
            }
        }

        await repoSearchQueue.add("search", {query: q})
        return {
            status: "processing",
            source: "queue",
            data: [],
        }
    })
}
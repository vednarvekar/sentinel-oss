import { FastifyInstance } from "fastify";
import { redis } from "../utils/redis.js";
import { repoIngestQueue, repoSearchQueue } from "../jobs/queues.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getRepoByOwnerAndName } from "../db/repos.repo.js";

export async function repoRoutes(server: FastifyInstance){
    server.get("/repos/search", { preHandler: requireAuth }, async(request, reply) => {
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

        await repoSearchQueue.add("search", {query: q, githubToken: request.user!.githubToken})
        return {
            status: "processing",
            source: "queue",
            data: [],
        }
    });

    server.get("/repos/:owner/:name", {preHandler: requireAuth}, async(request, reply) => {
        const {owner, name} = request.params as {
            owner: string,
            name: string,
        };

        const repo = await getRepoByOwnerAndName(owner, name);
        const STALE_MS = 24 * 60 * 60 * 1000;
        if(!repo || Date.now() - new Date(repo.ingested_at).getTime() > STALE_MS) {
            await repoIngestQueue.add("repo-ingest", {owner, name, githubToken: request.user!.githubToken});
            return {
                status: "processing",
                source: "queue",
            }
        }

        return {
            status: "ready",
            source: "db",
            data: repo,
        }
    });
};
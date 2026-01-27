import { FastifyInstance } from "fastify";
import { redis } from "../utils/redis.js";
import { repoIngestQueue, repoSearchQueue } from "../jobs/queues.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getRepoByOwnerAndName, getRepoFileCount } from "../db/repos.repo.js";

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

        await repoSearchQueue.add("search", 
            {query: q, githubToken: request.user!.githubToken}, 
        )
        return {
            status: "processing",
            source: "queue",
            data: [],
        }
    });
    
    // ------------------------------------------------------------------------------------------------
    
    server.get("/repos/:owner/:name", { preHandler: requireAuth }, async (request) => {

        const { owner, name } = request.params as { owner: string; name: string };
        const repo = await getRepoByOwnerAndName(owner, name);
        const fileCount = repo ? await getRepoFileCount(repo.id) : 0;
        const jobId = `ingest-${owner}-${name}`;

        // 1. Precise Math using UTC
        const lastIngest = repo ? new Date(repo.ingested_at).getTime() : 0;
        const isStale = (Date.now() - lastIngest) > (60 * 60 * 1000); // 1 Hour
        const needsIngest = !repo || fileCount === 0 || isStale;

        if(!needsIngest){
            console.log("🔥 No Ingest Needed");
        }
        
        if (needsIngest) {
            const existingJob = await repoIngestQueue.getJob(jobId);
            const state = existingJob ? await existingJob.getState() : null;
        
        // 2. If it's stale but NOT currently running, trigger it
        if (state !== 'active' && state !== 'waiting') {
            if (existingJob) await existingJob.remove(); // Clear failed/old jobs
            
            await repoIngestQueue.add("repo-ingest", 
                { owner, name, githubToken: request.user!.githubToken }, 
                { 
                    jobId,
                    attempts: 3, 
                    backoff: { type: "exponential", delay: 5000 },
                    removeOnComplete: true,
                    removeOnFail: true
                }
            );
            console.log("🚀 New Ingest Triggered");
        }
    }
    
    return {
        status: repo && !isStale ? "ready" : "processing",
        data: repo
    };
});
// ------------------------------------------------------------------------------------------------

    server.get("/repos/:repoId/issues", {preHandler: requireAuth} , async(request, reply) => {})
};
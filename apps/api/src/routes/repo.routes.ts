import { FastifyInstance } from "fastify";
import { redis } from "../utils/redis.js";
import { analysisQueue, issueIngestQueue, repoIngestQueue, repoSearchQueue } from "../jobs/queues.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getRepoByOwnerAndName, getRepoFileCount } from "../db/repos.repo.js";
import { getAllIssues, getIssueCount, getLatestIssueIngest } from "../db/issues.repo.js";
import { getIssueDataForAnalysis, getAnalysisResult } from "../db/analysis.repo.js";
import { cacheKeys, CacheTtlSeconds } from "../utils/cache.keys.js";

    // ------------------------------------------------------------------------------------------------

export async function repoRoutes(server: FastifyInstance){
    server.get("/repos/search", { preHandler: requireAuth }, async(request, reply) => {
        const {q} = request.query as {q?:string};

        if(!q) {
            return reply.status(400).send({error: "Missing Query"})
        }

        const cacheKey = cacheKeys.repoSearch(q);

        const cached = await redis.get(cacheKey);
        if(cached){
            return {
                status: "ready",
                source: "cache",
                data: JSON.parse(cached),
            }
        }

        const jobId = `search-${q.toLowerCase().trim()}`;
        await repoSearchQueue.add("search", 
            {query: q, githubToken: request.user!.githubToken}, 
            { jobId, removeOnComplete: true, removeOnFail: true }, 
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
        const jobId = `repository-${owner}-${name}`;

        // 1. Precise Math using UTC
        const lastIngest = repo?.ingested_at ? new Date(repo.ingested_at).getTime() : 0;
        const isStale = (Date.now() - lastIngest) > (60 * 60 * 1000); // 1 Hour
        const needsIngest = !repo || fileCount === 0 || isStale;

        if(!needsIngest){
            console.log("🔥 No Repository Ingest Needed");
        }
        
        if (needsIngest) {
            const existingJob = await repoIngestQueue.getJob(jobId);
            const state = existingJob ? await existingJob.getState() : null;
        
        // 2. If it's stale but NOT currently running, trigger it
        if (state !== 'active' && state !== 'waiting') {
            const lockKey = cacheKeys.repoIngestLock(owner, name);
            const lockAcquired = await redis.set(lockKey, "1", "EX", CacheTtlSeconds.repoIngestLock, "NX");
            if (lockAcquired === "OK") {
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
                console.log("🚀 New Repository Ingest Triggered");
            }
        }
    }
    
    return {
        status: repo && !isStale ? "ready" : "processing",
        data: repo
    }});

 // ------------------------------------------------------------------------------------------------

    server.get("/repos/:owner/:name/issues", { preHandler: requireAuth }, async (request, reply) => {
        const { owner, name } = request.params as { owner: string; name: string };
        
        // 1. Get the Repo first
        const repo = await getRepoByOwnerAndName(owner, name);
        if (!repo) return reply.status(404).send({ error: "Repo not found" });
        
        // 2. Check current status
        const issueCount = await getIssueCount(repo.id);
        const issues = await getAllIssues(repo.id);
        const latestIssueIngestAt = await getLatestIssueIngest(repo.id);
        const lastIngest = latestIssueIngestAt ? new Date(latestIssueIngestAt).getTime() : 0;
        const isStale = (Date.now() - lastIngest) > (60 * 60 * 1000); 
        const needsIngest = issues.length === 0 || isStale;
        
        if (needsIngest) {
            const jobId = `issues-${owner}-${name}`;
            const existingJob = await issueIngestQueue.getJob(jobId);
            const state = existingJob ? await existingJob.getState() : null;
            
            if (state !== 'active' && state !== 'waiting') {
                if (existingJob) await existingJob.remove();
                
                await issueIngestQueue.add("issue-ingest", 
                    { repoId: repo.id, owner, name, githubToken: request.user!.githubToken }, 
                    { 
                        jobId, 
                        attempts: 3, 
                        backoff: { type: "exponential", delay: 5000 },
                        removeOnComplete: true,
                        removeOnFail: true,
                    }
                );
            }
        }
        
        return {
            status: !needsIngest ? "ready" : "processing",
            count: issueCount,
            data: issues
        };
    });

    // ------------------------------------------------------------------------------------------------

    server.get("/issues/:issueId/analysis", { preHandler: requireAuth }, async (request, reply) => {
        const { issueId } = request.params as { issueId: string };
        const cacheKey = cacheKeys.issueAnalysis(issueId);

        // 1️⃣ Redis Cache
        const cached = await redis.get(cacheKey);
        if (cached) {
            return {
                status: "ready",
                source: "cache",
                data: JSON.parse(cached)
            };
        }

        // 2️⃣ Check DB
        const analysis = await getAnalysisResult(issueId);

        const isStale = analysis?.analyzed_at
            ? (Date.now() - new Date(analysis.analyzed_at).getTime()) > (60 * 60 * 1000)
            : true;

        if (!analysis || isStale) {

            const issue = await getIssueDataForAnalysis(issueId);
            if (!issue) {
                return reply.status(404).send({ error: "Issue not found" });
            }

            const jobId = `analyze-issue-${issueId}`;
            const existingJob = await analysisQueue.getJob(jobId);
            const state = existingJob ? await existingJob.getState() : null;

            if (state !== "active" && state !== "waiting") {
                if (existingJob) await existingJob.remove();

                await analysisQueue.add(
                    "analyze-job",
                    {
                        issueId: issue.id,
                        repoId: issue.repo_id
                    },
                    {
                        jobId,
                        attempts: 2,
                        backoff: { type: "exponential", delay: 5000 },
                        removeOnComplete: true,
                        removeOnFail: true
                    }
                );
            }

            return reply.status(202).send({
                status: "processing",
                source: "queue"
            });
        }

        // 3️⃣ Cache DB result
        await redis.set(cacheKey, JSON.stringify(analysis), "EX", CacheTtlSeconds.issueAnalysis);

        return {
            status: "ready",
            source: "db",
            data: analysis
        };
    });

    // ------------------------------------------------------------------------------------------------

};

import { Job } from "bullmq";
import { githubServices } from "../../service/github.service.js";
import { computeSignals } from "../../logic/analysis.logic.js";
import { saveIssueAnalysis, getIssueDataForAnalysis, getRepoFilesForAnalysis, updateFileContent } 
from "../../db/analysis.repo.js";
import { redis } from "../../utils/redis.js";
import { cacheKeys, CacheTtlSeconds } from "../../utils/cache.keys.js";


// issueAnalysis.worker.ts
export async function issueAnalysisWorker(job: Job) {
    const { issueId, repoId, owner, name, githubToken } = job.data;

    try {
        const issue = await getIssueDataForAnalysis(String(issueId));
        // We now need files WITH content and last_fetched_at
        const files = await getRepoFilesForAnalysis(repoId); 
        if (!issue) return;

        const signals = computeSignals(issue, files);
        const relevantMatches = signals.likelyPaths.slice(0, 15);
        const keywords = signals.keywordsUsed.slice(0, 8);

        const verifiedPaths = await Promise.all(relevantMatches.map(async (match) => {
            let code = match.content;
            const isStale = !match.last_fetched_at || 
                            (Date.now() - new Date(match.last_fetched_at).getTime() > 24 * 60 * 60 * 1000);

            // 🧠 SMART CACHE: Only hit GitHub if we don't have the code or it's old
            if (!code || isStale) {
                console.log(`📡 Fetching from GitHub (Cache Miss): ${match.path}`);
                code = await githubServices.getFileContent(owner, name, match.path, githubToken);
                
                // Save it so the NEXT issue analysis for this repo is INSTANT
                if (code) {
                    await updateFileContent(repoId, match.path, code);
                }
            } else {
                console.log(`⚡ Using Database Cache (Cache Hit): ${match.path}`);
            }

            const normalizedCode = (code || "").toLowerCase();
            const keywordHits = keywords.filter((keyword) => normalizedCode.includes(keyword)).length;
            const titleWords = issue.title.toLowerCase().split(/\s+/).filter((word: string) => word.length >= 4);
            const titleHits = titleWords.filter((word: string) => normalizedCode.includes(word)).length;
            const isVerified = keywordHits >= 2 || titleHits >= 1;

            return {
                path: match.path,
                score: match.score,
                signals: match.signals,
                verified: isVerified,
                evidence: {
                    keywordHits,
                    titleHits,
                },
            };
        }));

        const rankedPaths = verifiedPaths.sort((a, b) => {
            if (a.verified !== b.verified) return a.verified ? -1 : 1;
            return b.score - a.score;
        });

        await saveIssueAnalysis({
            issueId,
            likelyPaths: rankedPaths,
            difficulty: signals.difficulty,
            confidence: signals.confidence,
            explanation: `${signals.explanation} Keywords: ${signals.keywordsUsed.slice(0, 12).join(", ") || "none"}.`
        });

        await redis.set(
            cacheKeys.issueAnalysis(issueId),
            JSON.stringify({
                issueId,
                likelyPaths: rankedPaths,
                difficulty: signals.difficulty,
                confidenceScore: signals.confidence,
                explanation: `${signals.explanation} Keywords: ${signals.keywordsUsed.slice(0, 12).join(", ") || "none"}.`,
            }),
            "EX",
            CacheTtlSeconds.issueAnalysis
        );

        console.log(`✅ Successfully analyzed issue: ${issueId}`);
    } catch (err) {
        console.error("Analysis Worker Error:", err);
    }
}
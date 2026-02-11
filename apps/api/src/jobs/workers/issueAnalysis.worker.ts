import { Job } from "bullmq";
import { githubServices } from "../../service/github.service.js";
import { computeSignals } from "../../service/analysis.logic.js";
import { saveIssueAnalysis, getIssueForAnalysis, getRepoFilesForAnalysis, updateFileContent } 
from "../../db/analysis.repo.js";


// issueAnalysis.worker.ts
export async function issueAnalysisWorker(job: Job) {
    const { issueId, repoId, owner, name, githubToken } = job.data;

    try {
        const issue = await getIssueForAnalysis(issueId);
        // We now need files WITH content and last_fetched_at
        const files = await getRepoFilesForAnalysis(repoId); 
        if (!issue) return;

        const signals = computeSignals(issue, files);
        
        // Use the Threshold logic: don't just slice(0,3)
        // Take anything that is a strong match (score > 2)
        const relevantMatches = signals.likelyPaths.filter(p => p.score >= 2);

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

            const isVerified = code?.toLowerCase().includes(issue.title.toLowerCase().split(' ')[0]);
            return { ...match, verified: !!isVerified };
        }));

        await saveIssueAnalysis({
            issueId,
            likelyPaths: verifiedPaths,
            difficulty: signals.difficulty,
            confidence: signals.confidence,
            explanation: signals.explanation
        });

        console.log(`✅ Successfully analyzed issue: ${issueId}`);
    } catch (err) {
        console.error("Analysis Worker Error:", err);
    }
}






// // 1. Import your AI service (we'll create this next)
// import { aiService } from "../../service/ai.service.js";

// // ... inside the worker after you have verifiedPaths ...

// const cleanedBody = cleanGitHubBody(issue.body);

// // 2. Call the AI to "Reason" about the retrieved files
// const aiAnalysis = await aiService.analyzeIssue({
//     title: issue.title,
//     body: cleanedBody,
//     files: verifiedPaths.map(p => ({ path: p.path, content: p.content }))
// });

// // 3. Save the "Smart" result
// await saveIssueAnalysis({
//     issueId,
//     likelyPaths: verifiedPaths,
//     difficulty: aiAnalysis.difficulty || signals.difficulty,
//     confidence: aiAnalysis.confidence || signals.confidence,
//     explanation: aiAnalysis.explanation, // This is now a human-readable AI explanation
//     suggestedFix: aiAnalysis.suggestedFix // New column we need!
// });
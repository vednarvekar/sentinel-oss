import { computeSignals, IssueSignalsInput, RepoFileInput } from "../logic/analysis.logic.js";
import { analyzeWithLLM } from "../service/ai.service.js";

export async function runFullAnalysis(issue: IssueSignalsInput, files: RepoFileInput[]) {

    // Step 1: Local deterministic analysis
    const localResult = computeSignals(issue, files);

    // If nothing relevant found, skip LLM
    if (!localResult.likelyPaths.length) {
        return {
            ...localResult,
            aiAnalysis: null
        };
    }

    // Step 2: Send top files to LLM
    let aiAnalysis: string | null = null;
    try {
        aiAnalysis = await analyzeWithLLM(
            issue,
            localResult.likelyPaths
        );
    } catch (error) {
        console.error("LLM analysis failed; returning local analysis only:", error);
    }

    return {
        ...localResult,
        aiAnalysis
    };
}

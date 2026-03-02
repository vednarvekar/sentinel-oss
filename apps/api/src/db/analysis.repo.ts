import { db } from "./client.js";

export const saveIssueAnalysis = async (data: {
    issueId: string;
    likelyPaths: any[];
    difficulty: string;
    confidence: number;
    explanation: string;
    aiSummary?: string | null;
}) => {
    await db.query(`
        INSERT INTO issue_analysis 
        (issue_id, likely_paths, difficulty, confidence_score, explanation, ai_summary, analyzed_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (issue_id) DO UPDATE SET
            likely_paths = EXCLUDED.likely_paths,
            difficulty = EXCLUDED.difficulty,
            confidence_score = EXCLUDED.confidence_score,
            explanation = EXCLUDED.explanation,
            ai_summary = EXCLUDED.ai_summary,
            analyzed_at = NOW()`,
        [
            data.issueId,
            JSON.stringify(data.likelyPaths),
            data.difficulty,
            data.confidence,
            data.explanation,
            data.aiSummary ?? null
        ]
    );
};

export const getAnalysisResult = async (issueId: string) => {
    const res = await db.query(`
        SELECT issue_id, likely_paths, difficulty, confidence_score, explanation, analyzed_at
        FROM issue_analysis
        WHERE issue_id = $1`,
        [issueId]
    );
    return res.rows[0] || null;
};

export const getRepoFilesForAnalysis = async (repoId: string) => {
    const res = await db.query(`
        SELECT path, content, imports, urls, last_fetched_at
        FROM repo_files 
        WHERE repo_id = $1`,
        [repoId]
    );
    return res.rows;
};

// export const updateFileContent = async (repoId: string, path: string, content: string) => {
//     await db.query(
//         `UPDATE repo_files 
//         SET content = $1, last_fetched_at = NOW() 
//         WHERE repo_id = $2 AND path = $3`,
//         [content, repoId, path]
//     );
// };

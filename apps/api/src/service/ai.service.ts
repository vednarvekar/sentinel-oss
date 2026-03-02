import type { IssueSignalsInput } from "../logic/analysis.logic.js";

type RankedFile = {
    path: string;
    snippet: string | null;
};

export async function analyzeWithLLM(issue: IssueSignalsInput, rankedFiles: RankedFile[]) {
  if (!rankedFiles.length) return null;
    const payload = {
        issue: {
            title: issue.title,
            body: issue.body
        },
        relevantFiles: rankedFiles.slice(0, 5).map(f => ({
            path: f.path,
            snippet: f.snippet
        }))
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        },
        body: JSON.stringify({
            model: "openai/gpt-5-nano",
            temperature: 0.1,
            messages: [
                {
                    role: "system",
                    content:
                        "You are a senior backend engineer. Identify root cause precisely. Suggest minimal fix. Be concrete."
                },
                {
                    role: "user",
                    content: JSON.stringify(payload)
                }
            ]
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data?.error?.message || "LLM request failed");
    }

    return data.choices?.[0]?.message?.content || null;
}
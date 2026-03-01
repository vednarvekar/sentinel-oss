const STOP_WORDS = new Set([
    "the", "and", "for", "with", "this", "that", "from", "when", "then",
    "into", "your", "have", "does", "not", "are", "was", "were", "can",
    "cannot", "could", "would", "issue", "error", "after", "before", "about",
    "there", "their", "they", "them", "what", "where", "which", "while",
]);

const EXTENSION_HINTS: Record<string, string[]> = {
    test: ["test", "spec"],
    docs: ["md", "rst", "txt"],
    api: ["ts", "tsx", "js", "jsx"],
    types: ["d.ts", "ts"],
};

type IssueSignalsInput = {
    title: string;
    body: string | null;
    labels?: unknown;
};

type RepoFileInput = {
    path: string;
    content?: string;
    last_fetched_at?: Date;
};

function extractKeywords(issue: IssueSignalsInput): string[] {
    const labels = Array.isArray(issue.labels)
        ? issue.labels
            .map((label: any) => String(label?.name ?? label ?? ""))
            .join(" ")
        : "";

    const raw = `${issue.title} ${issue.body || ""} ${labels}`.toLowerCase();
    const words = raw.match(/[a-z0-9_.-]{3,}/g) || [];
    return Array.from(
        new Set(words.filter((word) => !STOP_WORDS.has(word) && !/^\d+$/.test(word)))
    );
}

export function computeSignals(issue: IssueSignalsInput, files: RepoFileInput[]) {
    const keywords = extractKeywords(issue);

    const scoredFiles = files.map((file) => {
        const pathLower = file.path.toLowerCase();
        const segments = pathLower.split(/[/.\\_-]+/g).filter(Boolean);

        let score = 0;
        const signals: string[] = [];

        for (const keyword of keywords) {
            if (segments.includes(keyword)) {
                score += 3;
                signals.push(`Path segment: ${keyword}`);
                continue;
            }

            if (pathLower.includes(keyword)) {
                score += 1;
                signals.push(`Path contains: ${keyword}`);
            }
        }

        for (const [hint, extensions] of Object.entries(EXTENSION_HINTS)) {
            if (keywords.includes(hint)) {
                const matched = extensions.find((ext) => pathLower.endsWith(`.${ext}`) || pathLower.endsWith(ext));
                if (matched) {
                    score += 2;
                    signals.push(`Extension hint: ${hint} -> ${matched}`);
                }
            }
        }

        return {
            path: file.path,
            score,
            signals,
            content: file.content,
            last_fetched_at: file.last_fetched_at,
        };
    });

    const allMatches = scoredFiles
        .filter((file) => file.score > 0)
        .sort((a, b) => b.score - a.score);

    const topScore = allMatches.length > 0 ? allMatches[0].score : 0;
    const likelyPaths = allMatches
        .filter((file) => file.score >= Math.max(2, Math.ceil(topScore * 0.5)))
        .slice(0, 25);

    let difficulty = "Easy";
    if (likelyPaths.length === 0) {
        difficulty = "Unknown";
    } else if (likelyPaths.length > 8) {
        difficulty = "Hard";
    } else if (likelyPaths.length >= 4) {
        difficulty = "Medium";
    }

    const confidence = Math.min(
        0.95,
        likelyPaths.length === 0 ? 0.1 : 0.45 + Math.min(0.45, topScore / 20)
    );

    return {
        likelyPaths,
        difficulty,
        confidence,
        keywordsUsed: keywords.slice(0, 40),
        explanation:
            likelyPaths.length > 0
                ? `Ranked ${likelyPaths.length} likely files using issue keywords, label hints, and path weighting.`
                : "No relevant file-path matches found from current issue text and labels.",
    };
}


export function cleanGitHubBody(body: string): string {
    if (!body) return "";

    return body
        // 1. Remove HTML comments .replace(//g, "")
        // 2. Collapse multiple newlines into a clean double-newline
        .replace(/\n\s*\n/g, "\n\n")
        // 3. Trim whitespace from ends
        .trim();
}

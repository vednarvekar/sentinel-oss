const STOP_WORDS = new Set([
    "the","and","for","with","this","that","from","when","then",
    "into","your","have","does","not","are","was","were","can",
    "cannot","could","would","after","before","about",
    "there","their","they","them","what","where","which","while",
    "fix","bug","problem"
]);

export type IssueSignalsInput = {
    title: string;
    body: string | null;
    labels?: unknown;
};

export type RepoFileInput = {
    path: string;
    content?: string;
    imports: string[];
    urls: string[];
    last_fetched_at?: Date;
};

// ---------------- KEYWORD EXTRACTION ----------------
function extractKeywords(issue: IssueSignalsInput): string[] {
    const labels = Array.isArray(issue.labels)
        ? issue.labels.map((l: any) => String(l?.name ?? l ?? "")).join(" ")
        : "";

    const raw = `${issue.title} ${issue.body || ""} ${labels}`
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .toLowerCase();

    const words = raw.match(/[a-z0-9_]{3,}/g) || [];

    return Array.from(
        new Set(words.filter(w => !STOP_WORDS.has(w) && !/^\d+$/.test(w)))
    );
}

// ---------------- SNIPPET EXTRACTION ----------------
function extractSnippet(content: string, keywords: string[]): string {
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const lower = lines[i].toLowerCase();

        if (keywords.some(k => lower.includes(k))) {
            const start = Math.max(0, i - 10);
            const end = Math.min(lines.length, i + 11);
            return lines.slice(start, end).join("\n");
        }
    }

    return lines.slice(0, 20).join("\n");
}

export function computeSignals(issue: IssueSignalsInput, files: RepoFileInput[]) {
    const keywords = extractKeywords(issue);

    // ---------------- PHASE 1 ----------------
    const phase1 = files.map(file => {
        const pathLower = file.path.toLowerCase();
        const segments = pathLower.split(/[/.\\_-]+/g).filter(Boolean);

        let score = 0;
        const signals: string[] = [];

        for (const keyword of keywords) {
            if (segments.some(seg => seg.includes(keyword))) {
                score += 3;
                signals.push(`Path segment: ${keyword}`);
            } else if (pathLower.includes(keyword)) {
                score += 1;
                signals.push(`Path contains: ${keyword}`);
            }
        }

        if (file.imports?.length) {
            const importsLower = file.imports.join(" ").toLowerCase();
            for (const keyword of keywords) {
                if (importsLower.includes(keyword)) {
                    score += 2;
                    signals.push(`Import match: ${keyword}`);
                }
            }
        }

        if (file.urls?.length) {
            const urlsLower = file.urls.join(" ").toLowerCase();
            for (const keyword of keywords) {
                if (urlsLower.includes(keyword)) {
                    score += 2;
                    signals.push(`URL match: ${keyword}`);
                }
            }
        }

        return { ...file, score, signals };
    });

    const phase1Top = phase1
        .filter(f => f.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 100);

    // ---------------- PHASE 2 ----------------
    const phase2 = phase1Top.map(file => {
        let score = file.score;
        const signals = [...file.signals];

        if (file.content) {
            const contentLower = file.content.toLowerCase();
            for (const keyword of keywords) {
                const matches = contentLower.split(keyword).length - 1;
                if (matches > 0) {
                    score += matches * 2;
                    signals.push(`Content: ${keyword} x${matches}`);
                }
            }
        }

        return { ...file, score, signals };
    });

    // ---------------- GRAPH BOOST (FORWARD + REVERSE) ----------------

    const scoreMap = new Map<string, number>();
    const reverseMap = new Map<string, string[]>();

    // Build score map
    for (const file of phase2) {
        scoreMap.set(file.path, file.score);
    }

    // Build reverse dependency map
    for (const file of phase2) {
        for (const imp of file.imports) {
            if (!reverseMap.has(imp)) reverseMap.set(imp, []);
            reverseMap.get(imp)!.push(file.path);
        }
    }

    for (const file of phase2) {
        const baseScore = file.score;

        // Forward boost (imports)
        for (const imp of file.imports) {
            if (scoreMap.has(imp)) {
                scoreMap.set(imp, scoreMap.get(imp)! + baseScore * 0.2);
            }
        }

        // Reverse boost (who imports this file)
        const dependents = reverseMap.get(file.path) || [];
        for (const dep of dependents) {
            if (scoreMap.has(dep)) {
                scoreMap.set(dep, scoreMap.get(dep)! + baseScore * 0.2);
            }
        }
    }

    const boostedRanked = phase2
        .map(file => ({
            ...file,
            score: scoreMap.get(file.path) ?? file.score
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 25);

    const topScore = boostedRanked.length > 0 ? boostedRanked[0].score : 0;

    const likelyPaths = boostedRanked
        .filter(f => f.score >= Math.max(2, Math.ceil(topScore * 0.5)))
        .map(file => ({
            path: file.path,
            score: file.score,
            signals: file.signals,
            snippet: file.content
                ? extractSnippet(file.content, keywords)
                : null
        }));

    return {
        likelyPaths,
        keywordsUsed: keywords.slice(0, 40),
        explanation:
            likelyPaths.length > 0
                ? `Ranked ${likelyPaths.length} likely files using 2-phase scoring + dependency boost.`
                : "No relevant matches found."
    };
}



export function cleanGitHubBody(body: string): string {
    if (!body) return "";
    return body.replace(/\n\s*\n/g, "\n\n").trim();
}
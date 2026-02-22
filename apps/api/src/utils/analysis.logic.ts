export function computeSignals(
    issue: {title: string, body: string}, 
    files: { path: string; content?: string; last_fetched_at?: Date }[]) 
    {

    // 1. Extracting keyword from body & title
    const content  = (issue.title + " " + (issue.body || " ")).toLowerCase();
    const words = content.match(/\b(\w{3,})\b/g) || []; // Only words 3+ chars
    const uniqueWords = Array.from(new Set(words));

    // 2. Score the files
    const scoredFiles = files.map(file => {
        const filePathLower = file.path.toLowerCase();
        let score = 0;
        let signals: string[] = [];

        uniqueWords.forEach(word => {
            if(filePathLower.includes(word)) {
                score += 1;
                signals.push(`Keyword: ${word}`);
            }
        });
        return {
            path: file.path, 
            score, 
            signals, 
            content: file.content,              
            last_fetched_at: file.last_fetched_at 
        };
    });

    // 3. Filter & Sort
    const allMatches = scoredFiles
        .filter(f => f.score > 0)
        .sort((a,b) => b.score - a.score)
    
    const topScore = allMatches.length > 0 ? allMatches[0].score : 0;
    const likelyPaths = allMatches.filter(f => f.score >= topScore * 0.5 || f.score > 2);

    let difficulty = "Easy"
    if(likelyPaths.length == 0) {
        difficulty = "Unknown"   
    } else if(likelyPaths.length >= 3 && likelyPaths.length <=5) {
        difficulty = "Medium"
    } else {
        difficulty = "Hard"
    }

    return {
        likelyPaths,
        difficulty,
        confidence : likelyPaths.length > 0 ? 0.7 : 0.1,
        explanation: likelyPaths.length > 0 
            ? `Identified ${likelyPaths.length} files based on keyword overlap between the issue description and repository structure`
            : "No direct file path matches found based on keywords." 
    }
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
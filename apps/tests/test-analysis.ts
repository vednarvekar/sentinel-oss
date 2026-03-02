import "dotenv/config";
import { runFullAnalysis } from "../apps/api/src/service/analysis.service.js";
import { getIssueDataForAnalysis } from "../apps/api/src/db/issues.repo.js";
import { getRepoFilesForAnalysis } from "../apps/api/src/db/analysis.repo.js";

async function main() {
    const ISSUE_ID = "PUT_REAL_ISSUE_ID_HERE";

    console.log("🔎 Fetching issue...");
    const issue = await getIssueDataForAnalysis(ISSUE_ID);
    if (!issue) {
        console.error("❌ Issue not found");
        process.exit(1);
    }

    console.log("📂 Fetching repo files...");
    const files = await getRepoFilesForAnalysis(issue.repo_id);

    console.log(`🧠 Running analysis on ${files.length} files...`);

    const result = await runFullAnalysis(issue, files);

    console.log("\n=== RESULT ===\n");
    console.log(JSON.stringify(result, null, 2));
}

main().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
import { Job, Worker } from "bullmq";
import { githubServices } from "../../service/github.service.js";
import { saveOrUpdateIssues } from "../../db/issues.repo.js";

export async function issuesFetchWorker(job: Job) {
    const {repoId, owner, name, githubToken} = job.data;
    
    try {     
        
        console.log("INGEST ISSUES:", owner, name);
        
        const issues = await githubServices.getRepoIssues(owner, name, githubToken);
        
        const filteredIssues = issues
        .filter((i: any) => !i.pull_request)
        .map((i: any) => ({
           id: i.id,
           repoId,
           number: i.number,
           title: i.title,
           body: i.body,
           state: i.state,
           labels: i.labels,
           createdAt: i.created_at,
           updatedAt: i.updated_at,
         }));
         
         await saveOrUpdateIssues(filteredIssues);
         console.log(`SUCCESS: Ingested ${filteredIssues.length} issues for ${owner}/${name}`);
         
    } catch (err) {
    console.error(`[Issues] FAILED for ${owner}/${name}:`, err);
    throw err;
    }
}
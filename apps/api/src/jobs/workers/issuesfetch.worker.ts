import { Worker } from "bullmq";
import { githubServices } from "../../service/github.service.js";
import { saveOrUpdateIssues } from "../../db/issues.repo.js";
import {connection} from "../queues.js"

export const issuesFetchWorker = () => {
    new Worker("issue-ingest", async(job) => {
        const {repoId, owner, name, githubToken} = job.data;

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
    }, {connection});
}
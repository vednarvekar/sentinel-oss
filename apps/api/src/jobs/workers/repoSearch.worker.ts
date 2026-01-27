import { Queue, Worker, Job } from "bullmq";
import {connection} from "../queues.js"
import { githubServices } from "../../service/github.service.js";

export async function repositorySearchWorker (job: Job) {
    // new Worker("repo-search", async(job) => {
        const {query, githubToken} = job.data;
        console.log("Searching in logs for:", query);
    
        const response = await githubServices.searchRepository(query, githubToken)
    
        const cachedKey = `repo:search:${query}`;

        await connection.set(cachedKey, JSON.stringify(response), "EX", 300)
    // },{connection});
}
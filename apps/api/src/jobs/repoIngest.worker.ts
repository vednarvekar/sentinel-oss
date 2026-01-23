import { Worker } from "bullmq";
import {connection} from "./queues.js"
import { createOrUpdateRepo, saveRepoFiles } from "../db/repos.repo.js";


new Worker("repo-ingest", async(job) => {
    const {query, githubToken} = job.data;
    console.log("Searching in logs for:", query);
})
import { Worker } from "bullmq";
import { connection } from "./jobs/queues.js";
import { repositorySearchWorker } from "./jobs/workers/repoSearch.worker.js";
import { repositoryFetchWorker } from "./jobs/workers/reposfetch.worker.js";
import { issuesFetchWorker } from "./jobs/workers/issuesfetch.worker.js";

let workers: Worker[] = [];

export const startWorkers = () => {
  console.log("👷 Workers starting...");

  workers.push(
    new Worker("repo-search", repositorySearchWorker, { connection }),
    new Worker("repo-ingest",  repositoryFetchWorker, { connection }),
    new Worker("issue-ingest", issuesFetchWorker, {connection})
  );

  console.log("✅ Workers alive:", workers.length);
};

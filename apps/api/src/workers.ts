import { Worker } from "bullmq";
import { connection } from "./jobs/queues.js";
import { repositorySearchWorker } from "./jobs/workers/repoSearch.worker.js";
import { repositoryFetchWorker } from "./jobs/workers/reposfetch.worker.js";

let workers: Worker[] = [];

export const startWorkers = () => {
  console.log("👷 Workers starting...");

  workers.push(
    new Worker("repo-search", repositorySearchWorker, { connection }),
    new Worker("repo-ingest",  repositoryFetchWorker, { connection })
  );

  console.log("✅ Workers alive:", workers.length);
};

import { Queue, Worker } from "bullmq";
import {Redis} from "ioredis";

export const connection = new Redis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
})

new Worker("repo-search", async(job) => {
    const {query} = job.data;
    console.log("Searching in logs for:", query);

    const result = [
        {
            company: "Sentinel",
            owner: "Ved Narvekar",
            stars: 200000,
            description: "Will be known",
        },
    ];

    const cachedKey = `repo:search:${query}`;

    await connection.set(cachedKey, JSON.stringify(result), "EX", 60)
},
{connection});

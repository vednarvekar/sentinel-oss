import { Worker } from "bullmq";
import {connection} from "./queues.js"
import { createOrUpdateRepo, saveRepoFiles } from "../db/repos.repo.js";
import { githubServices } from "../service/github.service.js"
import path from "node:path";

new Worker("repo-ingest", async(job) => {
    const {owner, name, githubToken} = job.data;

    console.log("INGEST REPO:", owner, name);

    const meta = await githubServices.getRepoMetaData(owner, name, githubToken);
    const defaultBranch = meta.default_branch;

    const repoId = await createOrUpdateRepo(
        owner, name, defaultBranch
    );

    const tree = await githubServices.getRepoTree(owner, name, defaultBranch, githubToken);

    if(!tree.tree){
        throw new Error("No tree returned from GitHub")
    }

    const files = tree.tree
        .filter((items: any) => items.type == "blob")
        .map((items:any) => {
            const extension = path.extname(items.path);
            return {
                path: items.path,
                extension: extension ? extension.slice(1) : null,
            }
        })
        
    console.log(`FILES FOUND: ${files.length}`);
    
    console.log("TREE SIZE:", tree.tree?.length);
    console.log("FIRST 5 TREE ITEMS:", tree.tree?.slice(0, 5));
    console.log("FILES TO INSERT:", files.length);


    await saveRepoFiles(repoId, files);

    console.log("INGEST COMPLETE:", owner, name);
}, {connection});
import { db } from "../../db/client.js";
import { Job } from "bullmq";
import { redis } from "../../utils/redis.js";
import { createOrUpdateRepo, saveRepoFiles } from "../../db/repos.repo.js";
import { githubServices } from "../../service/github.service.js"
import path from "node:path";

export async function repositoryFetchWorker(job: Job) {
    try{
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
        
        await db.query(`DELETE FROM repo_files WHERE repo_id = $1`, [repoId]);
        await saveRepoFiles(repoId, files);
        
        await redis.del(`repo:ingest:lock:${owner}:${name}`);
        console.log("INGEST COMPLETE:", owner, name);

    } catch (err) {
    console.error("❌ REPO INGEST FAILED:", err);
    throw err;
  }
};
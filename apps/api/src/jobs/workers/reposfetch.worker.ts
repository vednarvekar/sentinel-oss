import { db } from "../../db/client.js";
import { Job } from "bullmq";
import { redis } from "../../utils/redis.js";
import { createOrUpdateRepo, saveRepoFiles } from "../../db/repos.repo.js";
import { githubServices } from "../../service/github.service.js"
import path from "node:path";
import { cacheKeys } from "../../utils/cache.keys.js";

export async function repositoryFetchWorker(job: Job) {
    const { owner, name } = job.data;
    const lockKey = cacheKeys.repoIngestLock(owner, name);
    const ALLOWED_EXTS = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go'];

    try{
        const {githubToken} = job.data;
            
        console.log("INGEST REPO:", owner, name);
            
        const meta = await githubServices.getRepoOverviewData(owner, name, githubToken);
        const defaultBranch = meta.default_branch;
            
        const repoId = await createOrUpdateRepo(
            owner, name, defaultBranch
        );

        const 
        
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
        
        console.log("🏁 INGEST COMPLETE:", owner, name);

    } catch (err) {
    console.error("❌ REPO INGEST FAILED:", err);
    throw err;
  } finally {
    await redis.del(lockKey);
  }
};

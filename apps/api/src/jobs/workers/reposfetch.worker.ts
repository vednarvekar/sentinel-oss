import { db } from "../../db/client.js";
import { Job } from "bullmq";
import { redis } from "../../utils/redis.js";
import { createOrUpdateRepo, saveRepoFiles } from "../../db/repos.repo.js";
import { githubServices } from "../../service/github.service.js"
import path from "node:path";
import { cacheKeys } from "../../utils/cache.keys.js";
import pLimit from "p-limit";

type RepoFileMeta = {
  path: string;
  extension: string | null;
};

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
        
        const tree = await githubServices.getRepoTree(owner, name, defaultBranch, githubToken);
        if(!tree.tree){
            throw new Error("No tree returned from GitHub")
        }
        
        const files: RepoFileMeta[] = tree.tree
        .filter((items: any) => {
            if(items.type !== "blob") return false
            const extension = path.extname(items.path);

            return ALLOWED_EXTS.includes(extension)
        })
        .map((items:any) => ({
            path: items.path,
            extension: path.extname(items.path).slice(1),
        }));
        
        console.log(`FILES FOUND: ${files.length}`);

        const limit = pLimit(5);

        const fetchedFiles = await Promise.all(
            files.map((file: RepoFileMeta) => 
                limit(async() => {
                    const data = await githubServices.getFileImportsAndUrls(owner, name, file.path, githubToken)
                
                return {
                    path: file.path,
                    extension: file.extension,
                    imports: data.imports ,
                    urls: data.urls,
                    content: data.content,
                }
            })
        ));
        
        await db.query(`DELETE FROM repo_files WHERE repo_id = $1`, [repoId]);
        await saveRepoFiles(repoId, fetchedFiles);
        
        console.log("🏁 INGEST COMPLETE:", owner, name);

    } catch (err) {
    console.error("❌ REPO INGEST FAILED:", err);
    throw err;
  } finally {
    await redis.del(lockKey);
  }
};

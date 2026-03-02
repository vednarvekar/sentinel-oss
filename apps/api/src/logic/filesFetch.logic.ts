// import { Job } from "bullmq";
// import { db } from "../db/client.js";
// import { githubServices } from "../service/github.service.js";


// export async function extractFilesfromTree(job: Job) {
//     const {repoId, owner, name, githubToken} = job.data;

//     try {
//         const filesRes = await db.query(`
//             SELECT files FROM repo_files WHERE repoId = $1
//             `, [repoId]
//         );
//         const path = filesRes.rows[0].path

//         const ImportsandUrls = await githubServices.getFileImportsAndUrls(owner, name, path, githubToken)

//         await
        
//     } catch (error) {
        
//     }
// }
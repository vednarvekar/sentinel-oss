import {server} from "./server.js"
import { db } from "./db/client.js";
import { Result } from "pg";

export async function registerRoute() {
    server.get('/health', async() => {
        return {status: "Ok"};
    })
    
    server.get("/db-test", async () => {
        const result = await db.query("SELECT NOW()");
        return { time: result.rows[0].now };
    });

    server.get("/auth-success", async() => {
        return {time: Date.now(), status: "OK"};
    })
}

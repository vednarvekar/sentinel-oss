import {server} from "./server.js"
import { registerRoute } from "./app.js"
import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import {redis} from "./utils/redis.js"
import "./jobs/repoSearch.worker.js"

const start = async() =>{
    try {
        await registerRoute();

        await redis.set("HealthCheck", "OK")
        const value = await redis.get("HealthCheck")
        console.log(`Redis test value ${value}`)
        
        await server.listen({port: 4004})
        console.log(`API running on http://localhost:4004`)

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
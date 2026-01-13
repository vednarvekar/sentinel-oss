import {server} from "./server.js"
import { registerRoute } from "./app.js"
import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const start = async() =>{
    try {
        await registerRoute();
        
        await server.listen({port: 4004})
        console.log(`API running on http://localhost:4004`)

    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
}
start();
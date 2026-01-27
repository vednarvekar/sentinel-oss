import "dotenv/config";
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { server } from "./server.js";
import { registerRoute } from "./app.js";
import { db } from "./db/client.js";
import { redis } from "./utils/redis.js";

import { startWorkers } from "./workers.js";

async function start() {
  try {
    startWorkers();
    
    await registerRoute(server);

    // DB Check
    await db.query("SELECT 1");

    // Redis Check
    await redis.set("HealthCheck", "OK");
    const value = await redis.get("HealthCheck");
    console.log(`Redis test value ${value}`);

    // Start server
    await server.listen({ port: 4004 });
    console.log("API running on http://localhost:4004");

  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();

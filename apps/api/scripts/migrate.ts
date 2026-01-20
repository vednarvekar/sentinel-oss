// import fs from "fs";
// import path from "path";
// import pg from "pg";
// import "dotenv/config";

// const migrationsDir = path.resolve("migrations");

// const db = new pg.Pool({
//     connectionString: process.env.DATABASE_URL
// })

// async function run(){
//     const client = await db.connect();

//     try {
//         const applied = await client.query(
//             "SELECT name FROM migrations"
//         );
//         const appliedSet = new Set(applied.rows.map(r => r.name));

//         const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort();

//         for (const file of files) {
//       if (appliedSet.has(file)) continue;

//       const sql = fs.readFileSync(
//         path.join(migrationsDir, file),
//         "utf-8"
//       );

//       console.log(`→ Applying ${file}`);
//       await client.query("BEGIN");
//       await client.query(sql);
//       await client.query(
//         "INSERT INTO migrations (name) VALUES ($1)",
//         [file]
//       );
//       await client.query("COMMIT");
//     }

//     console.log("✓ Migrations complete");
//   } catch (err) {
//     await client.query("ROLLBACK");
//     throw err;
//   } finally {
//     client.release();
//     await db.end();
//   }
// }

// run().catch(err => {
//   console.error(err);
//   process.exit(1);
// });

import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { pool } from "./db/pool.js";

const app = buildApp();

async function start() {
  // fail fast on DB connectivity at boot
  await pool.query("select 1 as ok");

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});


import { env } from "./config/env.js";
import { buildApp } from "./app.js";
import { pool } from "./db/pool.js";

const app = buildApp();

async function waitForDb() {
  const startedAt = Date.now();
  const timeoutMs = 60_000;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await pool.query("select 1 as ok");
      return;
    } catch (err) {
      const elapsed = Date.now() - startedAt;
      if (elapsed > timeoutMs) throw err;
      app.log.warn({ err }, "DB not ready yet, retrying...");
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

async function start() {
  await waitForDb();

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

start().catch((err) => {
  app.log.error(err);
  process.exit(1);
});


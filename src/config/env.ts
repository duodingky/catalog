import dotenv from "dotenv";

dotenv.config();

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: mustGet("DATABASE_URL"),
  // API_KEY (single) or API_KEYS (comma-separated list) can be provided to allow API access
  API_KEYS: process.env.API_KEYS
    ? process.env.API_KEYS.split(",").map((k) => k.trim()).filter(Boolean)
    : process.env.API_KEY
    ? [process.env.API_KEY]
    : []
};


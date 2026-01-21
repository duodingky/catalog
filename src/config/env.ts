import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const initialEnvKeys = new Set(Object.keys(process.env));

function loadEnvFile(
  filePath: string,
  shouldSet: (key: string) => boolean
): void {
  if (!fs.existsSync(filePath)) return;

  const contents = fs.readFileSync(filePath, "utf8");
  const parsed = dotenv.parse(contents);

  for (const [key, value] of Object.entries(parsed)) {
    if (shouldSet(key)) {
      process.env[key] = value;
    }
  }
}

const envFileMap: Record<string, string> = {
  staging: ".env.staging",
  production: ".env.production"
};

const primaryEnvFile = envFileMap[process.env.NODE_ENV ?? ""] ?? ".env.local";

loadEnvFile(path.resolve(process.cwd(), ".env"), (key) => {
  return process.env[key] === undefined;
});
loadEnvFile(path.resolve(process.cwd(), primaryEnvFile), (key) => {
  return process.env[key] === undefined || !initialEnvKeys.has(key);
});

function mustGet(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: mustGet("DATABASE_URL"),
  JWT_PUBLIC_KEY: mustGet("JWT_PUBLIC_KEY"),
  SESSION_SECRET: mustGet("SESSION_SECRET")
};


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
  JWT_PUBLIC_KEY: mustGet("JWT_PUBLIC_KEY")
};


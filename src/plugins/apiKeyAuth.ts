import type { FastifyRequest, FastifyReply } from "fastify";
import { env } from "../config/env.js";

export async function ensureApiKey(request: FastifyRequest, reply: FastifyReply) {
  const headerKey = (request.headers["x-api-key"] as string) || null;
  const authHeader = (request.headers["authorization"] as string) || "";

  let key = headerKey;
  if (!key && authHeader) {
    const parts = authHeader.split(" ");
    if (parts.length === 2) key = parts[1];
  }

  if (!key) {
    return reply.status(401).send({ code: "UNAUTHORIZED", message: "Missing API key" });
  }

  const allowed = env.API_KEYS ?? [];
  if (!allowed.includes(key)) {
    return reply.status(401).send({ code: "UNAUTHORIZED", message: "Invalid API key" });
  }

  // Optionally attach info to request for later use
  // (e.g., request.user = { apiKey: key }) — avoided here to keep minimal

  return;
}

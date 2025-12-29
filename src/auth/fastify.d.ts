import "fastify";
import type { preValidationHookHandler } from "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: preValidationHookHandler;
    requirePermission: (required: "read" | "write") => preValidationHookHandler;
  }
}


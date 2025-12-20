import Fastify from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { ZodError } from "zod";
import { AppError } from "./shared/errors.js";
import { registerCategoryRoutes } from "./modules/category/routes.js";
import { registerBrandRoutes } from "./modules/brand/routes.js";
import { registerProductRoutes } from "./modules/product/routes.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(helmet);
  app.register(cors, { origin: true });

  app.get("/health", async () => ({ ok: true }));

  app.register(registerCategoryRoutes, { prefix: "/categories" });
  app.register(registerBrandRoutes, { prefix: "/brands" });
  app.register(registerProductRoutes, { prefix: "/products" });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        code: "VALIDATION_ERROR",
        message: "Invalid request",
        issues: err.issues
      });
    }

    if (err instanceof AppError) {
      return reply.status(err.statusCode).send({
        code: err.code,
        message: err.message
      });
    }

    app.log.error(err);
    return reply.status(500).send({ code: "INTERNAL_ERROR", message: "Internal server error" });
  });

  return app;
}


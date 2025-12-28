import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgCategoryRepository } from "./pgRepository.js";
import { CategoryService } from "./service.js";
import { categoryIdParamSchema, createCategoryBodySchema } from "./schema.js";
import { ensureApiKey } from "../../plugins/apiKeyAuth.js";

export const registerCategoryRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgCategoryRepository(pool);
  const service = new CategoryService(repo);

  app.get("/", { preHandler: ensureApiKey }, async () => {
    return await service.list();
  });

  app.get("/:id", { preHandler: ensureApiKey }, async (req) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    return await service.getByIdWithChildren(id);
  });

  app.post("/", async (req, reply) => {
    const body = createCategoryBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
  });
};


import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgCategoryRepository } from "./pgRepository.js";
import { CategoryService } from "./service.js";
import { categoryIdParamSchema, createCategoryBodySchema, updateCategoryBodySchema } from "./schema.js";

export const registerCategoryRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgCategoryRepository(pool);
  const service = new CategoryService(repo);

  app.get("/", { preValidation: [app.authenticate, app.requirePermission("read")] }, async () => {
    return await service.list();
  });

  app.get(
    "/:id",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    return await service.getByIdWithChildren(id);
    }
  );

  app.post(
    "/",
    { preValidation: [app.authenticate, app.requirePermission("write")] },
    async (req, reply) => {
    const body = createCategoryBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
    }
  );

  app.patch(
    "/:id",
    { preValidation: [app.authenticate, app.requirePermission("write")] },
    async (req) => {
      const { id } = categoryIdParamSchema.parse(req.params);
      const body = updateCategoryBodySchema.parse(req.body);
      return await service.update(id, body);
    }
  );
};


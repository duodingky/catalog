import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgCategoryRepository } from "./pgRepository.js";
import { CategoryService } from "./service.js";
import {
  categoryIdOrZeroParamSchema,
  categoryIdParamSchema,
  createCategoryBodySchema,
  listCategoriesQuerySchema,
  updateCategoryBodySchema
} from "./schema.js";

export const registerCategoryRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgCategoryRepository(pool);
  const service = new CategoryService(repo);

  app.get("/", { preValidation: [app.authenticate, app.requirePermission("read")] }, async (req) => {
    const { includeChildren, start, limit } = listCategoriesQuerySchema.parse(req.query);
    return await service.listPaged({ includeChildren, start, limit });
  });

  app.get(
    "/:id",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
      const { includeChildren, start, limit } = listCategoriesQuerySchema.parse(req.query);
      const { id } = categoryIdOrZeroParamSchema.parse(req.params);

      if (id === "0") {
        return await service.listPaged({ includeChildren, start, limit });
      }

      return await service.getByIdWithChildren(id, includeChildren);
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


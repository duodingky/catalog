import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgCategoryRepository } from "./pgRepository.js";
import { CategoryService } from "./service.js";
import { categoryIdParamSchema, createCategoryBodySchema } from "./schema.js";

export const registerCategoryRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgCategoryRepository(pool);
  const service = new CategoryService(repo);

  app.get("/", async () => {
    return await service.list();
  });

  app.get("/:id", async (req) => {
    const { id } = categoryIdParamSchema.parse(req.params);
    return await service.getById(id);
  });

  app.post("/", async (req, reply) => {
    const body = createCategoryBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
  });
};


import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgProductRepository } from "./pgRepository.js";
import { ProductService } from "./service.js";
import { createProductBodySchema, productIdParamSchema } from "./schema.js";

export const registerProductRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgProductRepository(pool);
  const service = new ProductService(repo);

  app.get("/", async () => {
    return await service.list();
  });

  app.get("/:id", async (req) => {
    const { id } = productIdParamSchema.parse(req.params);
    return await service.getById(id);
  });

  app.post("/", async (req, reply) => {
    const body = createProductBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
  });
};


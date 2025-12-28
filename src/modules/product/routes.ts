import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgBrandRepository } from "../brand/pgRepository.js";
import { PgProductRepository } from "./pgRepository.js";
import { ProductService } from "./service.js";
import { createProductBodySchema, productIdParamSchema, updateProductBodySchema } from "./schema.js";
import { ensureApiKey } from "../../plugins/apiKeyAuth.js";

export const registerProductRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgProductRepository(pool);
  const brandRepo = new PgBrandRepository(pool);
  const service = new ProductService(repo, brandRepo);

  app.get("/", { preHandler: ensureApiKey }, async () => {
    return await service.list();
  });

  app.get("/:id", { preHandler: ensureApiKey }, async (req) => {
    const { id } = productIdParamSchema.parse(req.params);
    return await service.getById(id);
  });

  app.post("/", async (req, reply) => {
    const body = createProductBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
  });

  app.patch("/:id", async (req) => {
    const { id } = productIdParamSchema.parse(req.params);
    const body = updateProductBodySchema.parse(req.body);
    return await service.update(id, body);
  });
};


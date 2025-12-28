import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgBrandRepository } from "./pgRepository.js";
import { BrandService } from "./service.js";
import { brandIdParamSchema, createBrandBodySchema } from "./schema.js";
import { ensureApiKey } from "../../plugins/apiKeyAuth.js";

export const registerBrandRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgBrandRepository(pool);
  const service = new BrandService(repo);

  app.get("/", { preHandler: ensureApiKey }, async () => {
    return await service.list();
  });

  app.get("/:id", { preHandler: ensureApiKey }, async (req) => {
    const { id } = brandIdParamSchema.parse(req.params);
    return await service.getById(id);
  });

  app.post("/", async (req, reply) => {
    const body = createBrandBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
  });
};


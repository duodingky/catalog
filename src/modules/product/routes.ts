import type { FastifyPluginAsync } from "fastify";
import { pool } from "../../db/pool.js";
import { PgBrandRepository } from "../brand/pgRepository.js";
import { PgCategoryRepository } from "../category/pgRepository.js";
import { PgProductRepository } from "./pgRepository.js";
import { ProductService } from "./service.js";
import { buildPagingMeta } from "../../shared/pagination.js";
import {
  categoryIdParamSchema,
  createProductBodySchema,
  listProductsQuerySchema,
  productIdParamSchema,
  productSearchBodySchema,
  updateProductBodySchema
} from "./schema.js";

export const registerProductRoutes: FastifyPluginAsync = async (app) => {
  const repo = new PgProductRepository(pool);
  const brandRepo = new PgBrandRepository(pool);
  const categoryRepo = new PgCategoryRepository(pool);
  const service = new ProductService(repo, brandRepo, categoryRepo);

  app.get(
    "/",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
      const { start, limit, featured } = listProductsQuerySchema.parse(req.query);
      return await service.listPaged({ start, limit, featured });
    }
  );

  app.post(
    "/search",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
      const { q, category, brand } = productSearchBodySchema.parse(req.body);
      const data = await service.search({ q, category, brand });
      return {
        data,
        meta: buildPagingMeta({
          totalRecord: data.length,
          startRecord: 0,
          returnedCount: data.length
        })
      };
    }
  );

  app.get(
    "/getByCategory/:id",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
      const { id } = categoryIdParamSchema.parse(req.params);
      const data = await service.getByCategoryId(id);
      return {
        data,
        meta: buildPagingMeta({
          totalRecord: data.length,
          startRecord: 0,
          returnedCount: data.length
        })
      };
    }
  );

  app.get(
    "/:id",
    { preValidation: [app.authenticate, app.requirePermission("read")] },
    async (req) => {
    const { id } = productIdParamSchema.parse(req.params);
    return await service.getById(id);
    }
  );

  app.post(
    "/",
    { preValidation: [app.authenticate, app.requirePermission("write")] },
    async (req, reply) => {
    const body = createProductBodySchema.parse(req.body);
    const created = await service.create(body);
    return reply.status(201).send(created);
    }
  );

  app.patch(
    "/:id",
    { preValidation: [app.authenticate, app.requirePermission("write")] },
    async (req) => {
    const { id } = productIdParamSchema.parse(req.params);
    const body = updateProductBodySchema.parse(req.body);
    return await service.update(id, body);
    }
  );
};


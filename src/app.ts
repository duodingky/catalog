import Fastify, { FastifyInstance, FastifyReply, FastifyRequest }  from "fastify";
import jwt from "jsonwebtoken";
import path from "path";
import fs from "fs";

import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";

import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import { registerAuth } from "./auth/plugin";
import { ZodError } from "zod";
import { AppError } from "./shared/errors";
import { ExtractJwt } from "passport-jwt";

import { registerCategoryRoutes } from "./modules/category/routes";
import { registerBrandRoutes } from "./modules/brand/routes";
import { registerProductRoutes } from "./modules/product/routes";


export async function buildApp() {
  const app = Fastify({
    logger: true
  });

app.register(helmet);
app.register(cors, { origin: true });

app.register(fastifyCookie);
app.register(fastifySession, {
  secret: process.env.SESSION_SECRET!,
  cookie: { secure: false },
});
 

// 🔑 Register auth BEFORE any routes that use requirePermission
await app.register(registerAuth);



app.get("/me", {
  preValidation: [app.authenticate], // ✅ require JWT
}, async (req, reply) => {
  // Echo back whatever Passport-JWT attached
  return { user: req.user };
});

app.get("/health", async () => ({ ok: true }));

app.get("/debug-token", async (req, reply) => {
  const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();
  const token = extractor(req);
  if (!token) return reply.code(400).send({ error: "No token" });


  const publicKey = fs.readFileSync(path.resolve("./scripts/keys/public.pem"), "utf8");

try {
    const payload = jwt.verify(token, publicKey, {
      algorithms: ["RS256"], // must match the signing algorithm
    });
    console.log("✅ Token verified:", payload);
    return payload;
  } catch (err) {
    console.error("❌ Token verification failed:", err);
    throw err;
  }


 


});


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


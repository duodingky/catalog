import type { FastifyPluginAsync, preValidationHookHandler } from "fastify";
import fastifyPassport from "@fastify/passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { env } from "../config/env.js";
import { ForbiddenError } from "../shared/errors";
import path from "path";
import fs from "fs";
import fp from "fastify-plugin";

export type JwtUser = {
  sub: string;
  permissions?: string[]; // preferred
  scope?: string[]; // common alternative
};

function normalizePemKey(v: string): string {
  const raw = v.trim();
  const pemLike = raw.includes("-----BEGIN");
  const decoded = pemLike ? raw : Buffer.from(raw, "base64").toString("utf8");
  return decoded.replace(/\\n/g, "\n");
}

function extractPermissions(user: JwtUser | undefined): Set<string> {
  const perms: string[] = [];

  if (user?.permissions && Array.isArray(user.permissions)) perms.push(...user.permissions);
  if (user?.scope && Array.isArray(user.scope)) perms.push(...user.scope);

  return new Set(perms.map((p) => p.trim().toLowerCase()).filter(Boolean));
}

export const registerAuth: FastifyPluginAsync =  fp(async (app) => {
  app.log.info("registerAuth plugin loaded");
   const extractor = ExtractJwt.fromAuthHeaderAsBearerToken();

   app.addHook("preHandler", async (req) => {
    const token = extractor(req);
    req.log.info({ token }, "Extracted JWT from Authorization header");
  });

     const publicKey = fs.readFileSync(path.resolve("./scripts/keys/public.pem"), "utf8");

  app.log.info( publicKey );
  await app.register(fastifyPassport.initialize());
  
  fastifyPassport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: publicKey,
        algorithms: ["RS256"],
         issuer: "auth.example.com",   // must match iss claim
    audience: "api.example.com",  // must match aud claim

      },
      async (payload, done) => {
         app.log.info({ payload }, "JWT strategy payload");

        return done(null, payload as JwtUser);
      }
    )
  );
   

  app.decorate("authenticate", async function (req, reply) {
  return new Promise((resolve, reject) => {
    fastifyPassport.authenticate("jwt", { session: false }, async (err, user, info) => {
      if (err) {
        req.log.error({ err }, "JWT error");
        return reject(err);
      }
      if (!user) {
        req.log.warn({ info }, "No user from JWT");
        return reject(new Error("Unauthorized"));
      }
      req.user = user; // ✅ attach user to request
      resolve(await user);
    })(req, reply);
  });
});


  app.decorate("requirePermission", (required: "read" | "write"): preValidationHookHandler => {
    return async (req) => {
      const user = req.user as JwtUser | undefined;
      const permissions = extractPermissions(user);

      const ok =
        required === "write"
          ? permissions.has("write")
          : permissions.has("read") || permissions.has("write");

      if (!ok) {
        throw new ForbiddenError(`Missing required permission: ${required}`);
      }
    };
  });
});


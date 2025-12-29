// src/plugins/auth.ts
import type { FastifyPluginAsync, preValidationHookHandler } from "fastify";
import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyPassport from "@fastify/passport";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { env } from "../config/env.js";
import { ForbiddenError } from "../shared/errors.js";

export type JwtUser = {
  sub?: string;
  permissions?: string[];
  scope?: string;
  scp?: string[];
  [k: string]: unknown;
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
  if (user?.scp && Array.isArray(user.scp)) perms.push(...user.scp);
  if (typeof user?.scope === "string") perms.push(...user.scope.split(/\s+/g));
  return new Set(perms.map((p) => p.trim().toLowerCase()).filter(Boolean));
}

const authPlugin: FastifyPluginAsync = async (app) => {
  const publicKey = normalizePemKey(env.JWT_PUBLIC_KEY);

  // 1. Cookies + session (needed for flash + passport sessions)
  await app.register(fastifyCookie);
  await app.register(fastifySession, {
    secret: env.SESSION_SECRET, // must be at least 32 chars
    cookie: { secure: false },  // true in production with HTTPS
  });

  // 2. Passport init + secure session
  await app.register(fastifyPassport.initialize());
  await app.register(fastifyPassport.secureSession());

  // 4. JWT strategy
  fastifyPassport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: publicKey,
        algorithms: ["RS256"],
      },
      async (payload, done) => {
        return done(null, payload as JwtUser);
      }
    )
  );

  // 5. Serializers (needed for session-based login)
  fastifyPassport.registerUserSerializer(async (user: JwtUser) => user.sub ?? "");
  fastifyPassport.registerUserDeserializer(async (id: string) => {
    // Replace with DB lookup if needed
    return { sub: id };
  });

  // 6. Decorators for auth + permission checks
  app.decorate("authenticate", fastifyPassport.authenticate("jwt", { authInfo: true }));
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
};

// Disable encapsulation so `app.authenticate` is available globally
export const registerAuth = fp(authPlugin, { name: "auth" });

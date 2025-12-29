import type { FastifyPluginAsync, preValidationHookHandler } from "fastify";
import fastifyPassport from "@fastify/passport";
import fp from "fastify-plugin";
import { ExtractJwt, Strategy as JwtStrategy } from "passport-jwt";
import { env } from "../config/env.js";
import { ForbiddenError } from "../shared/errors.js";

export type JwtUser = {
  sub?: string;
  permissions?: string[]; // preferred
  scope?: string; // common alternative (space-separated)
  scp?: string[]; // common alternative
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

  await app.register(fastifyPassport.initialize());
  
  fastifyPassport.use(
    "jwt",
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: publicKey,
        algorithms: ["RS256"]
      },
      async (payload, done) => {
        // Treat the JWT payload as the "user" object.
        return done(null, payload as JwtUser);
      }
    )
  );
   

  app.decorate("authenticate", fastifyPassport.authenticate("jwt", { authInfo: false }));


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

// Disable encapsulation so `app.authenticate` is available on the root instance.
export const registerAuth = fp(authPlugin, { name: "auth" });


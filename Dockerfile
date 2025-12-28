#
# Production image (multi-stage)
#
FROM node:22-alpine AS deps
RUN apk update && apk upgrade
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src ./src
COPY scripts ./scripts
COPY package.json ./
COPY package-lock.json ./
RUN npm run build

# prune devDependencies for runtime
RUN npm prune --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/db/migrations ./dist/src/db/migrations
EXPOSE 81

# Run migrations on boot, then start API
CMD ["sh", "-c", "node /app/dist/scripts/migrate.js && node /app/dist/src/server.js"]


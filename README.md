## Fastify + PostgreSQL REST API (SOLID-ish)

This is a starter Fastify REST API that follows a simple SOLID-ish structure:

- **Routes/controllers**: HTTP layer (Fastify routes)
- **Services**: business logic / use-cases
- **Repositories**: data access abstraction + Postgres implementations
- **DB**: PostgreSQL with SQL migrations

### Entities / schema

- **Category**: `id`, `categoryName`
- **Brand**: `id`, `brandName`
- **Product**: `id`, `productName`, `categoryId`, `brandId`, `price`, `shortDesc`, `longDesc`

Database migration: `src/db/migrations/001_init.sql`

### Quick start

1) Start Postgres + API (Docker):

```bash
docker compose up -d
```

2) (Optional) If running locally without Docker, configure env:

```bash
cp .env.example .env
```

3) Install deps (local dev):

```bash
npm install
```

4) Run migrations (local dev):

```bash
npm run migrate
```

5) Start the API (local dev):

```bash
npm run dev
```

API runs on `http://localhost:3000`.

### Endpoints

- **Health**
  - `GET /health`

- **Categories**
  - `GET /categories`
  - `GET /categories/:id`
  - `POST /categories` body: `{ "categoryName": "Shoes" }`

- **Brands**
  - `GET /brands`
  - `GET /brands/:id`
  - `POST /brands` body: `{ "brandName": "Nike" }`

- **Products**
  - `GET /products`
  - `GET /products/:id`
  - `POST /products` body:
    - `productName` (string)
    - `categoryId` (uuid)
    - `brandId` (uuid)
    - `price` (number or string, up to 2 decimals)
    - `shortDesc` (optional)
    - `longDesc` (optional)
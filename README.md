# Diggu Platform

Diggu is a full-stack local vendor platform with:
- API: NestJS + Prisma + PostgreSQL
- Web: Next.js App Router

## Monorepo Structure
- `api/` backend service
- `web/` frontend app

## Local Setup

### 1) API
1. Copy `.env.example` to `.env` inside `api/`.
2. Fill `DATABASE_URL`, `JWT_SECRET`, and other values.
3. Install and run:

```bash
cd api
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

API default: `http://localhost:3001`

### 2) Web
1. Copy `.env.example` to `.env.local` inside `web/`.
2. Set `NEXT_PUBLIC_API_URL=http://localhost:3001`
3. Install and run:

```bash
cd web
npm install
npm run dev
```

Web default: `http://localhost:3000`

## Production-Ready Checklist
- [ ] Secrets are not committed (`.env` ignored)
- [ ] `JWT_SECRET` is long and random
- [ ] Database is managed Postgres (Neon/Supabase)
- [ ] `CORS_ORIGIN` points to deployed web domain
- [ ] Swagger is disabled in production (`ENABLE_SWAGGER=false`)
- [ ] CI passes on every PR
- [ ] Health endpoint is reachable: `/api/v1/health`

## Free Deployment (Recommended)
Use:
- GitHub for source control
- Supabase (free) for PostgreSQL
- Render (free tier) for API
- Vercel (hobby tier) for web

See full guide in `DEPLOYMENT.md`.

For Prisma in production, use two DB URLs:
- `DATABASE_URL` for runtime app queries (pooled URL is fine)
- `DIRECT_URL` for migrations (`prisma migrate deploy` direct connection)

# Free Production Deployment Guide

This guide deploys your stack fully on free tiers:
- API (NestJS): Render Web Service
- Web (Next.js): Render Web Service
- Database: Supabase Postgres
- Source Control: GitHub

## 0) Create Accounts (One-Time)
1. GitHub account: https://github.com/signup
2. Render account: https://dashboard.render.com/register
3. Supabase account: https://supabase.com/dashboard/sign-up
Use the same GitHub account for Render OAuth so repository access is simple.

## 1) Push to GitHub

From the repository root:

```bash
git init
git add .
git commit -m "chore: prepare production baseline"
git branch -M main
git remote add origin https://github.com/<your-username>/diggu.git
git push -u origin main
```

## 2) Use Supabase Postgres
1. Open your Supabase project and go to Database connection settings.
2. Copy two URLs:
- pooled URL for runtime (`DATABASE_URL`, often port 6543)
- direct URL for migrations (`DIRECT_URL`, typically port 5432)
3. Ensure SSL mode is enabled in both URLs (`sslmode=require`).

## 3) Deploy API to Render (Free)
1. Render -> New -> Web Service -> connect your GitHub repo.
2. Root directory: `api`
3. Build command:

```bash
npm install && npx prisma generate && npm run build
```

4. Start command:

```bash
npm run start:prod
```

5. Add environment variables:
- `NODE_ENV=production`
- `PORT=10000` (Render injects this automatically, safe to keep)
- `DATABASE_URL=<supabase-pooled-url>`
- `DIRECT_URL=<supabase-direct-url>`
- `JWT_SECRET=<long-random-secret>`
- `JWT_EXPIRES_IN=15m`
- `CORS_ORIGIN=https://<your-vercel-app>.vercel.app`
- `ENABLE_SWAGGER=false`
- `UPLOAD_DIR=./uploads`
- `MAX_FILE_SIZE=5242880`
- `RESEND_API_KEY` (optional)
- `EMAIL_FROM` (optional)

6. Deploy and verify:
- `https://<render-service>.onrender.com/api/v1/health`

## 4) Deploy Web to Render (Free)
1. Render -> New -> Web Service -> connect your GitHub repo.
2. Root directory: `web`
3. Build command:

```bash
npm install && npm run build
```

4. Start command:

```bash
npm run start -- -H 0.0.0.0 -p $PORT
```

5. Environment variable:
- `NEXT_PUBLIC_API_URL=https://<your-render-api>.onrender.com`

6. Deploy.

## 5) Wire CORS and Re-Deploy API
Set `CORS_ORIGIN` in Render API service to your actual Render web URL and redeploy API.

## 6) Production Hardening
- Rotate all secrets after first deploy.
- Enable branch protection on `main`.
- Require pull requests and CI checks.
- Add at least one smoke test for `/api/v1/health`.
- Set dependency update bot (Dependabot/Renovate).
- Keep Prisma dual URL strategy:
	- `DATABASE_URL` for runtime traffic
	- `DIRECT_URL` for local Prisma admin commands if needed

This repository currently does not include Prisma migration files, so initialize or update schema with `npx prisma db push` from `api/` instead of `prisma migrate deploy`.

## 7) Operational Notes for Free Tier
- Render free instances can sleep when idle (cold starts expected).
- Keep uploads small; free disk is limited.
- Use external object storage later if upload traffic grows.

## 8) Blueprint Deploy (Fastest Path)
This repository already includes `render.yaml` for the API service.

1. Render Dashboard -> New -> Blueprint.
2. Select your GitHub repo.
3. Render detects `render.yaml` and creates `diggu-api` and `diggu-web`.
4. Fill env vars:
- API: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `CORS_ORIGIN`, `RESEND_API_KEY` (optional), `EMAIL_FROM` (optional)
- Web: `NEXT_PUBLIC_API_URL=https://<diggu-api>.onrender.com`
5. Deploy and verify endpoints:
- API health: `https://<diggu-api>.onrender.com/api/v1/health`
- Web: `https://<diggu-web>.onrender.com`

## 9) Quick Rollback Strategy
- Keep tagged releases in GitHub (`v1.0.0`, `v1.0.1`).
- Redeploy previous commit from Render dashboard when needed.

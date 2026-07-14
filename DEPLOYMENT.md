# Free Production Deployment Guide

This guide deploys your stack fully on free tiers:
- API (NestJS): Render Web Service
- Web (Next.js): Vercel
- Database: Neon Postgres
- Source Control: GitHub

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

## 2) Create Free Postgres (Neon)
1. Sign in to Neon.
2. Create a project and database.
3. Copy connection string.
4. Ensure SSL mode is enabled in URL (`?sslmode=require`).

## 3) Deploy API to Render (Free)
1. Render -> New -> Web Service -> connect your GitHub repo.
2. Root directory: `api`
3. Build command:

```bash
npm ci && npx prisma generate && npm run build
```

4. Start command:

```bash
npx prisma migrate deploy && npm run start:prod
```

5. Add environment variables:
- `NODE_ENV=production`
- `PORT=10000` (Render injects this automatically, safe to keep)
- `DATABASE_URL=<neon-url>`
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

## 4) Deploy Web to Vercel (Free)
1. Vercel -> Add New Project -> import the same GitHub repo.
2. Framework: Next.js
3. Root Directory: `web`
4. Environment variable:
- `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com`

5. Deploy.

## 5) Wire CORS and Re-Deploy API
Set `CORS_ORIGIN` in Render to your actual Vercel URL and redeploy API.

## 6) Production Hardening
- Rotate all secrets after first deploy.
- Enable branch protection on `main`.
- Require pull requests and CI checks.
- Add at least one smoke test for `/api/v1/health`.
- Set dependency update bot (Dependabot/Renovate).

## 7) Operational Notes for Free Tier
- Render free instances can sleep when idle (cold starts expected).
- Keep uploads small; free disk is limited.
- Use external object storage later if upload traffic grows.

## 8) Quick Rollback Strategy
- Keep tagged releases in GitHub (`v1.0.0`, `v1.0.1`).
- Redeploy previous commit from Render/Vercel dashboard when needed.

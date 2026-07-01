# Frontend — Vercel Deployment Guide

Deploy the React + Vite app (`frontend/`) as a **separate Vercel project** from the backend API.

## Prerequisites

- Backend deployed to Vercel (see [backend/DEPLOYMENT.md](../backend/DEPLOYMENT.md))
- Supabase schema applied (`npm run db:migrate`)

## Step 1: Create the Vercel project

1. **Add New Project** in the [Vercel dashboard](https://vercel.com/dashboard)
2. Import your Git repository
3. Configure:

| Setting | Value |
|---------|--------|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

`vercel.json` rewrites all routes to `index.html` for React Router client-side navigation.

## Step 2: Environment variables

In **Settings → Environment Variables**:

```env
# Recommended: same-origin /api (proxied to backend via frontend/vercel.json)
VITE_API_BASE_URL=/api

# Supabase (optional — for future direct client access)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-or-publishable-key
```

**Important:** `VITE_*` variables are baked in at **build time**. Redeploy the frontend after changing them.

`frontend/vercel.json` proxies `/api/*` → `https://table-tennis-backend.vercel.app/api/*`, so the browser calls the same origin and **CORS is not required** for API requests. Local dev uses the Vite proxy in `vite.config.js` for the same `/api` path.

If you set a full backend URL instead of `/api`, it **must include `https://`**.

Also set `CORS_ORIGIN` on the **backend** project to this frontend URL, e.g. `https://your-frontend.vercel.app`.

## Step 3: Deploy

Push to the connected branch, or:

```bash
cd frontend
npx vercel --prod
```

## Step 4: Verify

1. Open the deployed frontend URL
2. Log in with admin credentials (`cd backend && npm run create-admin` if not done)
3. Confirm API calls succeed (browser DevTools → Network tab)

## Local development

Copy `.env.example` to `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

Run both apps from repo root: `npm run dev`

## Troubleshooting

### "The page could not be found" / statistics API 404

- `VITE_API_BASE_URL` is missing `https://` — use `https://table-tennis-backend.vercel.app/api`, not `table-tennis-backend.vercel.app/api`
- Or the variable is wrong/missing — check Vercel env vars and **redeploy** the frontend

### "Backend server is not running"

- `VITE_API_BASE_URL` is wrong or missing — check Vercel env vars and redeploy
- Backend health check: `curl https://your-backend.vercel.app/api/health`

### CORS errors

- Backend `CORS_ORIGIN` must match this frontend URL exactly
- Update backend env and redeploy backend

### 404 on page refresh

- Ensure `frontend/vercel.json` is present (SPA rewrite to `index.html`)

## Related docs

- [Backend deployment](../backend/DEPLOYMENT.md)

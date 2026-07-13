# Deployment

Target: Vercel free tier.

## Vercel Settings

- Root directory: `apps/web`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `.next`

## Environment Variables

Optional:

```text
NEXT_PUBLIC_SITE_URL=https://your-vercel-url.vercel.app
```

Use the final production URL after the first deployment.

## Pre-Deploy Check

```bash
cd apps/web
npm run lint
npx tsc --noEmit
npm run build
```

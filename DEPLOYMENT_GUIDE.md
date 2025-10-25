# YallaFoot Deployment Guide

## 🚀 Recommended: Deploy to Vercel (5 minutes)

### Step 1: Prepare the project
```bash
# Move API functions to the right location
mkdir -p pages/api
cp netlify/functions/matches.js pages/api/matches.js
cp netlify/functions/simple-update.js pages/api/simple-update.js
cp netlify/functions/debug.js pages/api/debug.js
```

### Step 2: Update API endpoints in footballAPI.ts
Replace all `/netlify/functions/` with `/api/` in your fetch calls.

### Step 3: Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod
```

### Step 4: Add Environment Variables
In Vercel dashboard, add:
- `FOOTBALL_DATA_API_KEY` = your API key

That's it! Your site will be live with working API calls.

## Alternative: Railway Deployment

```bash
npm install -g @railway/cli
railway login
railway deploy
```

## Why Vercel is Perfect for YallaFoot:

✅ **Zero Configuration** - Works with Next.js out of the box
✅ **Serverless Functions** - No complex setup needed  
✅ **Automatic Builds** - Deploy on git push
✅ **Free Tier** - Perfect for your traffic levels
✅ **Fast Global CDN** - Better performance than Netlify for Next.js
✅ **Environment Variables** - Easy to manage
✅ **Custom Domains** - Free SSL included

## Current Issues with Netlify Static Export:
❌ Complex build process
❌ Function coordination issues  
❌ Static export limitations
❌ Trailing slash complications
❌ Build hanging issues

## Next Steps:
1. Try Vercel deployment (recommended)
2. If you prefer current setup, remove static export (already done)
3. Consider upgrading to a database later (PostgreSQL on Railway/Vercel)
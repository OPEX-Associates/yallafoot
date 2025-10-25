# 🆓 FREE TIER SETUP GUIDE

## ✅ What You Get (FREE)
- **100 API calls/day** (we'll use ~30-50)
- **Live scores** updated every 3 minutes during matches
- **All users** get cached data instantly
- **Zero hosting costs** on Vercel free tier
- **Professional UI** with cache transparency

## 🚀 Quick Setup (10 minutes)

### Step 1: Get Free API-Football Account
1. Go to: https://rapidapi.com/api-sports/api/api-football
2. Click "Subscribe to Test" (Free plan)
3. Copy your `X-RapidAPI-Key`

### Step 2: Test the API
```bash
curl -H "X-RapidAPI-Key: YOUR_KEY" \
     -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com" \
     "https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all"
```

### Step 3: Add Environment Variable
```bash
# Add to .env.local
RAPIDAPI_KEY=your_key_here
CACHE_UPDATE_KEY=your_secret_key_here
```

### Step 4: Test Locally
```bash
npm run dev

# Test the cache system
curl http://localhost:3000/api/cached-matches?type=today
curl http://localhost:3000/api/background-update
```

### Step 5: Deploy to Vercel
```bash
npm install -g vercel
vercel login
vercel --prod

# Add environment variables in Vercel dashboard
```

## 📊 Request Budget Planning

### **Live Match Day (Saturday/Sunday)**
- Background updates: 3min intervals × 8 hours = **40 requests**
- Manual triggers: **~5 requests**  
- **Daily total: ~45 requests** ✅

### **Regular Days**
- Fixture updates: 2-hour intervals = **12 requests**
- **Daily total: ~15 requests** ✅

### **Weekly Average: ~25 requests/day** 
**Well within 100/day limit!** 🎉

## 🎯 Cache Strategy Details

### **Live Matches (Saturday 2pm-10pm)**
- Server updates every **3 minutes**
- Users get **instant cached data**
- 1 API call serves **unlimited users**

### **Upcoming Matches**
- Updates every **30 minutes**
- Fresh fixture data
- Minimal API usage

### **Tomorrow's Fixtures**
- Updates every **2 hours**
- Perfect for planning
- Very efficient

## 💡 Smart Features Built-In

✅ **Auto-scaling**: More users = same API usage
✅ **Cache transparency**: Users see cache age
✅ **Failure resilience**: Falls back to last good cache
✅ **Admin controls**: Force updates when needed
✅ **Request monitoring**: Track daily usage

## 🔧 Files Created

- `/lib/cache-manager.js` - Smart caching system
- `/api/cached-matches.js` - Cache-first API endpoint  
- `/api/background-update.js` - Auto-update scheduler
- `/src/hooks/useCachedMatches.ts` - React hook
- `/src/components/CachedMatches.tsx` - UI component
- `/vercel.json` - Cron job configuration

## 🎪 Ready to Test!

Update your matches page:

```jsx
// src/app/matches/page.tsx
import CachedMatches from '@/components/CachedMatches';

export default function MatchesPage() {
  return <CachedMatches />;
}
```

**Your free tier football platform is ready!** ⚽

Once you validate it works perfectly, you can upgrade to Basic Plan ($10/month) for more frequent updates.
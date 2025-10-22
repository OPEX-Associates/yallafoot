# 🆓 Free Football APIs Guide for YallaFoot

This guide shows you how to get **completely free** football data for your YallaFoot platform.

## 🥇 **Option 1: Football-Data.org (RECOMMENDED)**

### ✅ **Why This is Best:**
- **Completely Free**: No credit card required
- **Generous Limits**: 10 requests/minute
- **Quality Data**: Official data from major leagues
- **Reliable**: Stable and well-documented API

### 🏆 **Competitions Included (Free Tier):**
- **Premier League** (England)
- **Championship** (England)
- **Bundesliga** (Germany)
- **Serie A** (Italy)
- **Ligue 1** (France)
- **Eredivisie** (Netherlands)
- **Primeira Liga** (Portugal)
- **La Liga** (Spain)
- **Champions League**
- **Europa League**
- **World Cup** (when active)
- **European Championship** (when active)

### 🚀 **Quick Setup:**

1. **Register for Free:**
   - Go to: https://www.football-data.org/client/register
   - Enter your email (no credit card needed)
   - Verify your email

2. **Get Your API Key:**
   - Login to your dashboard
   - Copy your API token

3. **Add to Your Project:**
   ```bash
   # Create .env.local file in your project root
   NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_token_here
   ```

4. **Done!** Your site now has live data from major leagues.

---

## 🥈 **Option 2: API-Sports (RapidAPI)**

### ✅ **Why This is Good:**
- **More Leagues**: 1000+ leagues worldwide
- **Rich Data**: Detailed statistics and lineups
- **Free Tier**: 100 requests/day

### 🚀 **Setup:**

1. **Sign up:**
   - Go to: https://rapidapi.com/api-sports/api/api-football
   - Create free account

2. **Subscribe to Free Plan:**
   - Click "Subscribe to Test"
   - Select "Basic" (free tier)

3. **Get API Key:**
   - Copy your X-RapidAPI-Key

4. **Update Code:**
   ```typescript
   // Change in src/lib/footballAPI.ts
   const API_KEY = process.env.NEXT_PUBLIC_FOOTBALL_API_KEY || 'YOUR_KEY';
   const API_HOST = 'api-football-v1.p.rapidapi.com';
   
   const headers = {
     'X-RapidAPI-Key': API_KEY,
     'X-RapidAPI-Host': API_HOST
   };
   ```

---

## 🥉 **Option 3: TheSportsDB (Completely Free)**

### ✅ **Why Consider:**
- **No API Key**: No registration needed
- **No Limits**: Unlimited requests for non-commercial
- **Simple**: Easy to integrate

### ⚠️ **Limitations:**
- Less frequent updates
- Basic data structure
- Limited live scores

### 🚀 **Quick Implementation:**
```typescript
// Example endpoint (no key needed)
const response = await fetch(
  'https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328'
);
```

---

## 🎯 **Recommended Setup for YallaFoot:**

### **For Beginners:**
Use **Football-Data.org** - it's the perfect balance of:
- Free and reliable
- No credit card needed
- Covers major leagues
- Good documentation

### **For Advanced Users:**
Combine multiple APIs:
- **Football-Data.org** for major leagues
- **TheSportsDB** for additional leagues
- **API-Sports** for detailed statistics

---

## 📊 **API Limits Comparison:**

| API | Free Requests | Credit Card | Leagues | Live Scores |
|-----|--------------|-------------|---------|-------------|
| **Football-Data.org** | 10/minute | ❌ No | 12 major | ✅ Yes |
| **API-Sports** | 100/day | ❌ No | 1000+ | ✅ Yes |
| **TheSportsDB** | Unlimited* | ❌ No | Many | ⚠️ Limited |

*Non-commercial use only

---

## 🛠️ **Implementation Notes:**

### **Current Code Supports:**
- ✅ Football-Data.org (configured)
- ✅ Graceful fallbacks to mock data
- ✅ Error handling
- ✅ Rate limiting awareness

### **To Switch APIs:**
Just change the API endpoint and headers in `src/lib/footballAPI.ts`

### **No API Key? No Problem!**
Your site works perfectly with realistic mock data until you add a real API key.

---

## 🚀 **Get Started in 2 Minutes:**

1. **Visit:** https://www.football-data.org/client/register
2. **Register** with your email
3. **Copy** your API token
4. **Add** to `.env.local`: `NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_token`
5. **Deploy** and enjoy live football data!

Your YallaFoot platform will now display real matches from Premier League, Champions League, and other major competitions! ⚽🎉
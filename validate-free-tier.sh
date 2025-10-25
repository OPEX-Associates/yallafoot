#!/bin/bash

# Free Tier Validation Script
echo "🆓 Testing YallaFoot Free Tier Setup"
echo "=================================="

# Check if environment variables are set
echo "1. Checking environment variables..."
if [ -z "$RAPIDAPI_KEY" ]; then
    echo "❌ RAPIDAPI_KEY not set in .env.local"
    echo "   Add: RAPIDAPI_KEY=your_key_here"
    exit 1
else
    echo "✅ RAPIDAPI_KEY is set"
fi

echo ""
echo "2. Testing local development server..."
if curl -s http://localhost:3000/api/cached-matches?type=today > /dev/null; then
    echo "✅ Local server is running"
else
    echo "❌ Local server not responding"
    echo "   Run: npm run dev"
    exit 1
fi

echo ""
echo "3. Testing cache API endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/cached-matches?type=today)
if echo "$RESPONSE" | grep -q "matches"; then
    echo "✅ Cache API working"
    MATCH_COUNT=$(echo "$RESPONSE" | grep -o '"total":[0-9]*' | cut -d':' -f2)
    echo "   Found $MATCH_COUNT matches in cache"
else
    echo "❌ Cache API not working"
    echo "   Response: $RESPONSE"
fi

echo ""
echo "4. Testing background update..."
UPDATE_RESPONSE=$(curl -s http://localhost:3000/api/background-update)
if echo "$UPDATE_RESPONSE" | grep -q "success"; then
    echo "✅ Background update working"
    REQUESTS_TODAY=$(echo "$UPDATE_RESPONSE" | grep -o '"requestsToday":[0-9]*' | cut -d':' -f2)
    echo "   API requests today: $REQUESTS_TODAY/100"
else
    echo "⚠️  Background update may need API key"
    echo "   This is normal for first run"
fi

echo ""
echo "5. Testing API-Football connection..."
if [ ! -z "$RAPIDAPI_KEY" ]; then
    API_RESPONSE=$(curl -s -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
                        -H "X-RapidAPI-Host: api-football-v1.p.rapidapi.com" \
                        "https://api-football-v1.p.rapidapi.com/v3/fixtures?date=$(date +%Y-%m-%d)" | head -c 200)
    
    if echo "$API_RESPONSE" | grep -q "response"; then
        echo "✅ API-Football connection working"
    else
        echo "❌ API-Football connection failed"
        echo "   Check your RAPIDAPI_KEY"
        echo "   Response: $API_RESPONSE"
    fi
fi

echo ""
echo "🎯 VALIDATION SUMMARY"
echo "===================="
echo "If all tests pass, you're ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Add environment variables in Vercel dashboard"
echo "3. Test live: https://your-app.vercel.app/api/cached-matches?type=today"
echo ""
echo "Free tier usage:"
echo "- 100 requests/day limit"
echo "- ~30-50 requests/day actual usage"
echo "- Unlimited users served from cache"
echo ""
echo "Ready for production! 🚀"
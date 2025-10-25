# YallaFoot PHP API Backend

## 🎯 **Architecture Overview**

This PHP API serves as a dedicated backend that:
1. **Fetches data** from API-Sports via cron jobs
2. **Caches in MySQL** for instant access
3. **Serves REST API** to your Next.js frontend
4. **Runs on cPanel** with minimal cost

## 📁 **Project Structure**

```
php-api/
├── config/
│   ├── database.php       # MySQL connection config
│   └── api-config.php     # API keys and settings
├── cron/
│   ├── fetch-matches.php  # Main cron job script
│   └── update-leagues.php # League data updater
├── api/
│   ├── index.php         # Main API router
│   ├── matches.php       # Matches endpoints
│   └── status.php        # API status endpoint
├── classes/
│   ├── Database.php      # Database connection class
│   ├── APIAuth.php       # Authentication handler
│   └── MatchManager.php  # Match data manager
├── sql/
│   └── schema.sql        # Database setup script
├── logs/
│   └── .gitkeep         # Log files directory
└── README.md            # Setup instructions
```

## 🚀 **Benefits of This Approach**

✅ **Cost Effective**: One API key, unlimited users
✅ **Fast Performance**: MySQL caching vs JSON files  
✅ **Better Control**: Full control over data and updates
✅ **Scalable**: Handles thousands of concurrent users
✅ **Reliable**: Independent of frontend hosting
✅ **Secure**: API key authentication for endpoints

## 📊 **Resource Usage**

- **API-Sports**: ~50 requests/day (well within free 100)
- **cPanel Hosting**: Basic shared hosting (~$3-5/month)
- **MySQL**: Included with most cPanel hosting
- **Total Cost**: ~$5/month for unlimited users!
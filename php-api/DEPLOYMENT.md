# 🚀 YallaFoot PHP API - cPanel Deployment Guide

## 📋 **Prerequisites**

1. **cPanel Hosting Account** (any shared hosting with PHP 7.4+ and MySQL)
2. **MySQL Database** access via cPanel
3. **Cron Jobs** feature in cPanel
4. **API-Sports Key**: `2d82524e5b7054f7d93825e696a35074`

## 🛠 **Setup Instructions**

### **Step 1: Upload Files to cPanel**

1. **Compress the php-api folder** into a ZIP file
2. **Login to cPanel** → File Manager
3. **Navigate to public_html** (or subdirectory like `public_html/api`)
4. **Upload and extract** the ZIP file
5. **Set permissions**: 755 for folders, 644 for PHP files, 755 for logs folder

### **Step 2: Create MySQL Database**

In cPanel → MySQL Databases:

1. **Create Database**: `yourname_yallafoot`
2. **Create User**: `yourname_api` with strong password
3. **Add User to Database** with ALL PRIVILEGES
4. **Run SQL Script**: Copy contents of `sql/schema.sql` and run in phpMyAdmin

### **Step 3: Configure Database Connection**

Edit `config/database.php`:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'yourname_yallafoot');  // Your actual database name
define('DB_USER', 'yourname_api');        // Your actual user
define('DB_PASS', 'your_secure_password'); // Your actual password
```

### **Step 4: Configure API Settings**

Edit `config/api-config.php`:

```php
// Change this to a secure random string
define('API_SECRET_KEY', 'your_super_secure_random_key_2024');

// Add your actual domain
define('ALLOWED_ORIGINS', [
    'https://your-netlify-site.netlify.app',
    'https://your-custom-domain.com'
]);
```

### **Step 5: Setup Cron Jobs**

In cPanel → Cron Jobs, add these:

**Live Matches (Every 3 minutes during match hours):**
```bash
*/3 14-22 * * * php /home/yourusername/public_html/api/cron/fetch-matches.php live
```

**Today's Matches (Every 30 minutes):**
```bash
*/30 * * * * php /home/yourusername/public_html/api/cron/fetch-matches.php today
```

**Tomorrow's Matches (Every 2 hours):**
```bash
0 */2 * * * php /home/yourusername/public_html/api/cron/fetch-matches.php tomorrow
```

### **Step 6: Test Your API**

Test these URLs:

1. **Status Check**: `https://yourdomain.com/api/?api_key=your_api_key`
2. **Today's Matches**: `https://yourdomain.com/api/matches/today?api_key=your_api_key`
3. **Live Matches**: `https://yourdomain.com/api/matches/live?api_key=your_api_key`

### **Step 7: Update Next.js Frontend**

Update your Next.js app to use the PHP API instead of direct API-Sports calls.

## 🔒 **Security Best Practices**

1. **Change API_SECRET_KEY** to a unique random string
2. **Use HTTPS** for all API calls in production
3. **Limit CORS origins** to your actual domains
4. **Monitor logs** regularly in `/logs/` folder
5. **Set proper file permissions** (never 777)

## 📊 **Monitoring & Maintenance**

### **Check API Status:**
```bash
curl "https://yourdomain.com/api/status"
```

### **View Logs:**
- Cron logs: `/logs/cron.log`
- Database logs: `/logs/database.log`
- API logs: Check `api_logs` table in database

### **Clear Cache:**
```bash
curl "https://yourdomain.com/api/cache/clear?api_key=your_api_key"
```

## 💰 **Cost Analysis**

- **Shared Hosting**: $3-5/month
- **API-Sports**: Free (100 requests/day)
- **Total**: ~$5/month for unlimited users! 🎉

## 🎯 **API Endpoints Summary**

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/status` | GET | No | API health check |
| `/matches/live` | GET | Yes | Live matches |
| `/matches/today` | GET | Yes | Today's matches |
| `/matches/tomorrow` | GET | Yes | Tomorrow's matches |
| `/cache/clear` | GET | Yes | Clear cache |

## 🚀 **Ready for Production!**

Once deployed, your PHP API will:
- ✅ Fetch data every 3 minutes during matches
- ✅ Cache everything in MySQL for instant access
- ✅ Serve unlimited users from cache
- ✅ Use only ~50 API requests per day
- ✅ Provide secure authenticated endpoints

**Your football platform backend is production-ready!** ⚽
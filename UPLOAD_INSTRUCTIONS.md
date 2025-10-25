# 🚀 DEPLOYMENT INSTRUCTIONS FOR football.opex.associates

## 📁 **File Upload Structure**

You need to upload your `php-api` folder contents to your cPanel hosting. Here's the correct structure:

### **Your Domain Root Structure:**
```
public_html/
├── index.php                     # Main API router (from php-api/api/index.php)
├── status-dashboard.php          # Status dashboard
├── config/
│   ├── database.php
│   └── api-config.php
├── classes/
│   ├── Database.php
│   ├── APIAuth.php
│   └── MatchManager.php
├── cron/
│   └── fetch-matches.php
└── logs/                         # Create this folder with 755 permissions
```

## 🔧 **Quick Upload Steps**

### **Step 1: Move API Router**
Copy `php-api/api/index.php` → `public_html/index.php`

### **Step 2: Upload Supporting Files**
Upload these folders to `public_html/`:
- `config/`
- `classes/`
- `cron/`

### **Step 3: Create Logs Folder**
In cPanel File Manager, create `public_html/logs/` with 755 permissions

### **Step 4: Upload Status Dashboard**
Copy `php-api/status-dashboard.php` → `public_html/status-dashboard.php`

## 🎯 **Your API URLs Will Be:**

### **Main API Endpoints:**
```
https://football.opex.associates/                                    # API status
https://football.opex.associates/matches/today?api_key=YOUR_KEY      # Today's matches
https://football.opex.associates/matches/live?api_key=YOUR_KEY       # Live matches
https://football.opex.associates/matches/tomorrow?api_key=YOUR_KEY   # Tomorrow's matches
```

### **Status Dashboard:**
```
https://football.opex.associates/status-dashboard.php
```

## 🔑 **Your Production API Key:**
```
yf_prod_e8c0a8a6a6b4b8c8d4c8e8f0f4f8c8b8a0a4b8c8d4e8f0f4a8b8c8d4e8f0f4c8
```

## 📋 **Upload Checklist**

- [ ] Upload `api/index.php` as `public_html/index.php`
- [ ] Upload `config/` folder to `public_html/config/`
- [ ] Upload `classes/` folder to `public_html/classes/`
- [ ] Upload `cron/` folder to `public_html/cron/`
- [ ] Upload `status-dashboard.php` to `public_html/`
- [ ] Create `logs/` folder with 755 permissions
- [ ] Configure database credentials in `config/database.php`
- [ ] Set up MySQL database using `sql/schema.sql`
- [ ] Add cron jobs for data fetching

## 🚀 **Test Commands After Upload:**

```bash
# Test API status
curl "https://football.opex.associates/"

# Test status dashboard  
curl "https://football.opex.associates/status-dashboard.php"

# Test matches endpoint
curl "https://football.opex.associates/matches/today?api_key=yf_prod_e8c0a8a6a6b4b8c8d4c8e8f0f4f8c8b8a0a4b8c8d4e8f0f4a8b8c8d4e8f0f4c8"
```

Once you upload these files, your API will be live! 🎉
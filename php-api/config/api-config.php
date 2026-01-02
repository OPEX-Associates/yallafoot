<?php
/**
 * YallaFoot API Configuration
 * 
 * IMPORTANT: Change these values for production!
 */

// API Authentication
define('API_SECRET_KEY', 'yf_prod_' . hash('sha256', 'football.opex.associates.2024'));
define('API_SPORTS_KEY', '2d82524e5b7054f7d93825e696a35074');

// Admin Authentication (change these values for production)
define('ADMIN_SECRET_KEY', 'yf_admin_' . hash('sha256', 'football.opex.associates.admin.2024'));
define('ADMIN_USERNAME', 'yf_admin');
define('ADMIN_PASSWORD', 'change_me');

// API-Sports Configuration
define('API_SPORTS_BASE_URL', 'https://v3.football.api-sports.io');
define('API_SPORTS_HEADER', 'x-apisports-key');

// Rate Limiting (requests per day)
define('MAX_API_REQUESTS_PER_DAY', 90); // Leave buffer from 100 limit

// Cache Settings (in minutes)
define('CACHE_LIVE_MATCHES', 3);      // Live matches: 3 minutes
define('CACHE_TODAY_MATCHES', 30);    // Today's matches: 30 minutes  
define('CACHE_TOMORROW_MATCHES', 120); // Tomorrow's matches: 2 hours
define('CACHE_LEAGUES', 1440);        // Leagues: 24 hours

// CORS Settings
define('ALLOWED_ORIGINS', [
    'http://localhost:3000',
    'https://football.opex.associates',
    'https://yallafoot.netlify.app',
    'https://www.football.opex.associates'
]);

// Timezone
define('APP_TIMEZONE', 'UTC');
date_default_timezone_set(APP_TIMEZONE);

// Logging
define('ENABLE_LOGGING', true);
define('LOG_LEVEL', 'INFO'); // DEBUG, INFO, WARNING, ERROR

// Error Reporting (disable in production)
if (defined('ENVIRONMENT') && ENVIRONMENT === 'production') {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}
?>

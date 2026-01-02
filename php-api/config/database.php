<?php
/**
 * Database Configuration
 * 
 * Update these settings for your cPanel MySQL database
 */

// Database Configuration
define('DB_HOST', 'localhost');           // Usually 'localhost' on cPanel
define('DB_NAME', 'nexusaca_yallafoot'); // Your cPanel database name
define('DB_USER', 'nexusaca_yallafoot'); // Your cPanel database user
define('DB_PASS', 'yT46mVAXU1H3(Jr+'); // Your cPanel database password
define('DB_CHARSET', 'utf8mb4');

// Connection Options
define('DB_OPTIONS', [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
]);

/**
 * Example cPanel Database Setup:
 * 
 * 1. Login to cPanel
 * 2. Go to "MySQL Databases"
 * 3. Create database: yourname_yallafoot
 * 4. Create user: yourname_api
 * 5. Add user to database with ALL PRIVILEGES
 * 6. Update the constants above with your actual values
 * 
 * Final values will look like:
 * define('DB_NAME', 'yourname_yallafoot');
 * define('DB_USER', 'yourname_api');
 * define('DB_PASS', 'your_secure_password');
 */
?>
<?php
// CORS Headers for YallaFoot API
// Add these headers to the top of your PHP API index.php file

// Allow requests from your Netlify domain
header('Access-Control-Allow-Origin: https://yallafoot.netlify.app');

// Allow specific methods
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');

// Allow specific headers
header('Access-Control-Allow-Headers: X-API-Key, Content-Type, Accept');

// Allow credentials if needed
header('Access-Control-Allow-Credentials: false');

// Handle preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Optional: Suppress PHP errors for cleaner JSON output
error_reporting(0);
ini_set('display_errors', 0);

/* 
INSTRUCTIONS:
1. Add the above headers to the very top of your index.php file (after <?php)
2. Or create a separate cors.php file and include it in your index.php
3. The error_reporting lines will also fix the PHP warnings we saw
*/
?>
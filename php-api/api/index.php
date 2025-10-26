<?php
/**
 * YallaFoot API - Main Router
 * 
 * This is the main entry point for all API requests
 * Access via: https://yourdomain.com/api/
 */

// Set error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include configuration and classes
require_once __DIR__ . '/../config/api-config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/APIAuth.php';
require_once __DIR__ . '/../classes/MatchManager.php';

// Enable CORS
APIAuth::enableCORS();

// Start timing for performance logging
$startTime = microtime(true);

try {
    // Parse request
    $requestMethod = $_SERVER['REQUEST_METHOD'];
    $requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($requestPath, '/'));
    
    // Remove 'api' from path if present
    if (isset($pathParts[0]) && $pathParts[0] === 'api') {
        array_shift($pathParts);
    }
    
    // Handle both path-based and query parameter routing
    $endpoint = $_GET['endpoint'] ?? $pathParts[0] ?? 'status';
    $action = $_GET['action'] ?? $pathParts[1] ?? null;
    
    // Also check for 'type' parameter for matches
    if ($endpoint === 'matches' && !$action && isset($_GET['type'])) {
        $action = $_GET['type'];
    }
    
    // Debug logging
    error_log("API Debug - Endpoint: $endpoint, Action: $action, Method: $requestMethod");
    
    // Public endpoints that don't require authentication
    $publicEndpoints = ['status', 'health'];
    
    // Authenticate for protected endpoints
    if (!in_array($endpoint, $publicEndpoints)) {
        if (!APIAuth::authenticate()) {
            exit(); // Authentication failed, response already sent
        }
    }
    
    // Route to appropriate handler
    switch ($endpoint) {
        case 'status':
        case 'health':
            handleStatusRequest();
            break;
            
        case 'matches':
            handleMatchesRequest($action);
            break;
            
        case 'cache':
            handleCacheRequest($action);
            break;
            
        default:
            APIAuth::sendErrorResponse('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    $responseTime = round((microtime(true) - $startTime) * 1000);
    APIAuth::logRequest($_SERVER['REQUEST_URI'], $responseTime, 500, $e->getMessage());
    APIAuth::sendErrorResponse('Internal server error', 500, $e->getMessage());
}

function handleStatusRequest() {
    global $startTime;
    
    try {
        $db = Database::getInstance();
        
        // Test database connection
        $dbTest = $db->fetchOne("SELECT 1 as test");
        
        // Get API usage stats
        $rateLimitInfo = APIAuth::getRateLimitInfo();
        
        // Get match counts
        $matchManager = new MatchManager();
        $liveMatches = count($matchManager->getLiveMatches());
        $todayMatches = count($matchManager->getTodayMatches());
        $tomorrowMatches = count($matchManager->getTomorrowMatches());
        
        $responseTime = round((microtime(true) - $startTime) * 1000);
        
        $status = [
            'api' => 'YallaFoot API',
            'version' => '1.0.0',
            'status' => 'operational',
            'timestamp' => date('c'),
            'database' => $dbTest ? 'connected' : 'error',
            'response_time_ms' => $responseTime,
            'matches' => [
                'live' => $liveMatches,
                'today' => $todayMatches,
                'tomorrow' => $tomorrowMatches
            ],
            'api_usage' => $rateLimitInfo
        ];
        
        APIAuth::logRequest('/status', $responseTime, 200);
        APIAuth::sendSuccessResponse($status);
        
    } catch (Exception $e) {
        $responseTime = round((microtime(true) - $startTime) * 1000);
        APIAuth::logRequest('/status', $responseTime, 500, $e->getMessage());
        APIAuth::sendErrorResponse('Status check failed', 500, $e->getMessage());
    }
}

function handleMatchesRequest($action) {
    global $startTime;
    
    try {
        $matchManager = new MatchManager();
        $type = $_GET['type'] ?? $action ?? 'today';
        
        // Check for popular leagues filter
        $popularOnly = isset($_GET['popular']) && $_GET['popular'] === 'true';
        $tier = isset($_GET['tier']) ? (int)$_GET['tier'] : null;
        
        // Validate type
        $allowedTypes = ['live', 'today', 'tomorrow'];
        if (!in_array($type, $allowedTypes)) {
            APIAuth::sendErrorResponse("Invalid type. Allowed: " . implode(', ', $allowedTypes), 400);
        }
        
        // Validate tier if provided
        if ($tier !== null && !in_array($tier, [1, 2])) {
            APIAuth::sendErrorResponse("Invalid tier. Allowed: 1 (top leagues only), 2 (all popular leagues)", 400);
        }
        
        // Get matches based on type and filters
        switch ($type) {
            case 'live':
                if ($popularOnly) {
                    $matches = $matchManager->getPopularLiveMatches($tier);
                } else {
                    $matches = $matchManager->getLiveMatches();
                }
                break;
            case 'today':
                if ($popularOnly) {
                    $matches = $matchManager->getPopularTodayMatches($tier);
                } else {
                    $matches = $matchManager->getTodayMatches();
                }
                break;
            case 'tomorrow':
                $matches = $matchManager->getTomorrowMatches($popularOnly, $tier);
                break;
        }
        
        // Transform matches for API response
        $transformedMatches = array_map([$matchManager, 'transformMatchForAPI'], $matches);
        
        // Get cache info
        $cacheInfo = $matchManager->getCacheInfo($type);
        $rateLimitInfo = APIAuth::getRateLimitInfo();
        
        $responseTime = round((microtime(true) - $startTime) * 1000);
        
        $meta = [
            'total' => count($transformedMatches),
            'live' => count(array_filter($transformedMatches, function($m) { return $m['isLive']; })),
            'type' => $type,
            'popular_only' => $popularOnly,
            'tier' => $tier,
            'cache_info' => $cacheInfo,
            'api_usage' => $rateLimitInfo,
            'response_time_ms' => $responseTime
        ];
        
        APIAuth::logRequest("/matches/$type", $responseTime, 200);
        APIAuth::sendSuccessResponse($transformedMatches, $meta);
        
    } catch (Exception $e) {
        $responseTime = round((microtime(true) - $startTime) * 1000);
        APIAuth::logRequest("/matches", $responseTime, 500, $e->getMessage());
        APIAuth::sendErrorResponse('Failed to fetch matches', 500, $e->getMessage());
    }
}

function handleCacheRequest($action) {
    global $startTime;
    
    if ($action !== 'clear') {
        APIAuth::sendErrorResponse('Invalid cache action', 400);
    }
    
    try {
        $db = Database::getInstance();
        
        // Clear old matches (older than 7 days)
        $db->query("DELETE FROM matches WHERE match_date < DATE_SUB(NOW(), INTERVAL 7 DAY)");
        
        // Reset cache metadata
        $db->query("UPDATE cache_metadata SET last_update = '1970-01-01 00:00:00'");
        
        $responseTime = round((microtime(true) - $startTime) * 1000);
        
        APIAuth::logRequest("/cache/clear", $responseTime, 200);
        APIAuth::sendSuccessResponse([
            'message' => 'Cache cleared successfully',
            'timestamp' => date('c')
        ]);
        
    } catch (Exception $e) {
        $responseTime = round((microtime(true) - $startTime) * 1000);
        APIAuth::logRequest("/cache/clear", $responseTime, 500, $e->getMessage());
        APIAuth::sendErrorResponse('Failed to clear cache', 500, $e->getMessage());
    }
}
?>
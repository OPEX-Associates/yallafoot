<?php
/**
 * API Authentication Handler
 */
class APIAuth {
    
    public static function authenticate() {
        $headers = self::getHeaders();
        
        // Check for API key in headers
        $apiKey = $headers['X-API-Key'] ?? $headers['x-api-key'] ?? null;
        
        // Also check query parameter as fallback
        if (!$apiKey) {
            $apiKey = $_GET['api_key'] ?? null;
        }
        
        if (!$apiKey || $apiKey !== API_SECRET_KEY) {
            self::sendUnauthorizedResponse();
            return false;
        }
        
        return true;
    }
    
    public static function getHeaders() {
        $headers = [];
        
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
        } else {
            // Fallback for some hosting environments
            foreach ($_SERVER as $key => $value) {
                if (strpos($key, 'HTTP_') === 0) {
                    $header = str_replace('HTTP_', '', $key);
                    $header = str_replace('_', '-', $header);
                    $header = ucwords(strtolower($header), '-');
                    $headers[$header] = $value;
                }
            }
        }
        
        return $headers;
    }
    
    public static function enableCORS() {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (in_array($origin, ALLOWED_ORIGINS)) {
            header("Access-Control-Allow-Origin: $origin");
        } else {
            header("Access-Control-Allow-Origin: *");
        }
        
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, X-API-Key, x-api-key, X-Admin-Key, x-admin-key");
        header("Access-Control-Max-Age: 3600");
        
        // Handle preflight requests
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(200);
            exit();
        }
    }

    public static function authenticateAdmin() {
        $headers = self::getHeaders();
        $adminKey = $headers['X-Admin-Key'] ?? $headers['x-admin-key'] ?? null;

        if (!$adminKey) {
            $adminKey = $_GET['admin_key'] ?? null;
        }

        if (!$adminKey || $adminKey !== ADMIN_SECRET_KEY) {
            self::sendErrorResponse('Admin authorization required', 401);
        }

        return true;
    }
    
    public static function sendUnauthorizedResponse() {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Unauthorized',
            'message' => 'Valid API key required',
            'timestamp' => date('c')
        ]);
        exit();
    }
    
    public static function sendErrorResponse($message, $code = 500, $details = null) {
        http_response_code($code);
        header('Content-Type: application/json');
        
        $response = [
            'error' => true,
            'message' => $message,
            'timestamp' => date('c')
        ];
        
        if ($details && (defined('ENVIRONMENT') && ENVIRONMENT !== 'production')) {
            $response['details'] = $details;
        }
        
        echo json_encode($response);
        exit();
    }
    
    public static function sendSuccessResponse($data, $meta = []) {
        http_response_code(200);
        header('Content-Type: application/json');
        
        $response = [
            'success' => true,
            'data' => $data,
            'timestamp' => date('c')
        ];
        
        if (!empty($meta)) {
            $response['meta'] = $meta;
        }
        
        echo json_encode($response);
        exit();
    }
    
    public static function logRequest($endpoint, $responseTime = null, $statusCode = 200, $error = null) {
        try {
            $db = Database::getInstance();
            
            $logData = [
                'endpoint' => $endpoint,
                'method' => $_SERVER['REQUEST_METHOD'],
                'ip_address' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'response_time_ms' => $responseTime,
                'status_code' => $statusCode,
                'error_message' => $error
            ];
            
            $db->insertOrUpdate('api_logs', $logData);
            
        } catch (Exception $e) {
            // Don't fail the request if logging fails
            error_log("Failed to log API request: " . $e->getMessage());
        }
    }
    
    public static function getRateLimitInfo() {
        try {
            $db = Database::getInstance();
            $requestsToday = $db->getApiRequestsToday();
            
            return [
                'requests_today' => $requestsToday,
                'limit' => MAX_API_REQUESTS_PER_DAY,
                'remaining' => max(0, MAX_API_REQUESTS_PER_DAY - $requestsToday),
                'reset_time' => date('Y-m-d 00:00:00', strtotime('+1 day'))
            ];
            
        } catch (Exception $e) {
            return [
                'requests_today' => 0,
                'limit' => MAX_API_REQUESTS_PER_DAY,
                'remaining' => MAX_API_REQUESTS_PER_DAY,
                'reset_time' => date('Y-m-d 00:00:00', strtotime('+1 day'))
            ];
        }
    }
}
?>

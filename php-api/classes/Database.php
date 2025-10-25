<?php
/**
 * Database Connection Manager
 */
class Database {
    private static $instance = null;
    private $connection;
    
    private function __construct() {
        try {
            $dsn = sprintf(
                "mysql:host=%s;dbname=%s;charset=%s",
                DB_HOST,
                DB_NAME,
                DB_CHARSET
            );
            
            $this->connection = new PDO($dsn, DB_USER, DB_PASS, DB_OPTIONS);
            
            // Set timezone
            $this->connection->exec("SET time_zone = '+00:00'");
            
        } catch (PDOException $e) {
            $this->logError("Database connection failed: " . $e->getMessage());
            throw new Exception("Database connection failed");
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        try {
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            $this->logError("Query failed: " . $e->getMessage() . " SQL: " . $sql);
            throw new Exception("Database query failed");
        }
    }
    
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }
    
    public function insertOrUpdate($table, $data, $updateFields = []) {
        try {
            $fields = array_keys($data);
            $placeholders = ':' . implode(', :', $fields);
            
            $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES ({$placeholders})";
            
            if (!empty($updateFields)) {
                $updateParts = [];
                foreach ($updateFields as $field) {
                    $updateParts[] = "{$field} = VALUES({$field})";
                }
                $sql .= " ON DUPLICATE KEY UPDATE " . implode(', ', $updateParts);
            }
            
            $stmt = $this->connection->prepare($sql);
            $stmt->execute($data);
            
            return $this->connection->lastInsertId() ?: true;
            
        } catch (PDOException $e) {
            $this->logError("Insert/Update failed: " . $e->getMessage());
            throw new Exception("Database operation failed");
        }
    }
    
    public function getApiRequestsToday() {
        $result = $this->fetchOne(
            "SELECT SUM(api_requests_today) as total FROM cache_metadata WHERE last_reset_date = CURDATE()"
        );
        return (int)($result['total'] ?? 0);
    }
    
    public function incrementApiRequests($cacheKey) {
        $this->query(
            "UPDATE cache_metadata 
             SET api_requests_today = api_requests_today + 1,
                 total_api_requests = total_api_requests + 1,
                 last_update = NOW(),
                 last_reset_date = CURDATE()
             WHERE cache_key = ?",
            [$cacheKey]
        );
    }
    
    public function resetDailyCounters() {
        $this->query(
            "UPDATE cache_metadata 
             SET api_requests_today = 0, last_reset_date = CURDATE() 
             WHERE last_reset_date < CURDATE()"
        );
    }
    
    private function logError($message) {
        if (ENABLE_LOGGING) {
            $logFile = __DIR__ . '/../logs/database.log';
            $timestamp = date('Y-m-d H:i:s');
            file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
        }
    }
    
    public function __destruct() {
        $this->connection = null;
    }
}
?>
<?php
/**
 * Main Cron Job for Fetching Match Data
 * 
 * This script should be run via cPanel cron jobs:
 * - Every 3 minutes during match hours (14:00-22:00 UTC)
 * - Every 30 minutes for daily fixtures
 * - Every 2 hours for tomorrow's fixtures
 * 
 * Example cPanel cron job commands:
 * Every 3 minutes during match hours: php /path/to/cron/fetch-matches.php live
 * Every 30 minutes for today: php /path/to/cron/fetch-matches.php today  
 * Every 2 hours for tomorrow: php /path/to/cron/fetch-matches.php tomorrow
 */

// Prevent web access
if (isset($_SERVER['HTTP_HOST'])) {
    die('This script can only be run from command line.');
}

// Include configuration and classes
require_once __DIR__ . '/../config/api-config.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/popular-leagues.php';
require_once __DIR__ . '/../classes/Database.php';
require_once __DIR__ . '/../classes/MatchManager.php';

class MatchFetcher {
    private $db;
    private $matchManager;
    private $logFile;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->matchManager = new MatchManager($this->db);
        $this->logFile = __DIR__ . '/../logs/cron.log';
        
        // Ensure logs directory exists
        $logDir = dirname($this->logFile);
        if (!is_dir($logDir)) {
            mkdir($logDir, 0755, true);
        }
        
        // Log startup
        $this->log("=== CRON JOB STARTED ===");
        $this->log("PHP Version: " . PHP_VERSION);
        $this->log("Memory Limit: " . ini_get('memory_limit'));
        $this->log("Max Execution Time: " . ini_get('max_execution_time'));
        $this->log("API Sports Key: " . (API_SPORTS_KEY ? 'SET (' . substr(API_SPORTS_KEY, 0, 8) . '...)' : 'NOT SET'));
        $this->log("Database Host: " . DB_HOST);
        $this->log("Database Name: " . DB_NAME);
        
        // Test database connection
        try {
            $this->db->getConnection()->query("SELECT 1");
            $this->log("Database connection: SUCCESS");
        } catch (Exception $e) {
            $this->log("Database connection: FAILED - " . $e->getMessage());
        }
        
        // Reset daily counters if needed
        $this->db->resetDailyCounters();
        $this->log("Daily counters reset completed");
    }
    
    public function fetchMatches($type = 'today') {
        $startTime = microtime(true);
        $this->log("=== FETCH MATCHES START ===");
        $this->log("Fetch type: $type");
        $this->log("Start time: " . date('Y-m-d H:i:s'));
        
        try {
            // Check current API usage
            $requestsToday = $this->db->getApiRequestsToday();
            $this->log("Current API requests today: $requestsToday/" . MAX_API_REQUESTS_PER_DAY);
            
            // Check if we need to update based on cache age
            $shouldUpdate = $this->shouldUpdate($type);
            $this->log("Should update cache: " . ($shouldUpdate ? 'YES' : 'NO'));
            
            if (!$shouldUpdate) {
                $this->log("Cache is still fresh for $type, skipping update");
                $this->log("=== FETCH MATCHES END (CACHED) ===");
                return;
            }
            
            // Check API rate limit
            if ($requestsToday >= MAX_API_REQUESTS_PER_DAY) {
                $this->log("API rate limit reached: $requestsToday/" . MAX_API_REQUESTS_PER_DAY);
                $this->log("=== FETCH MATCHES END (RATE LIMITED) ===");
                return;
            }
            
            // Get API endpoint (with popular leagues filtering)
            $endpoint = $this->getAPIEndpoint($type, true); // true = popular leagues only
            if (!$endpoint) {
                $this->log("ERROR: Unknown type '$type'");
                $this->log("=== FETCH MATCHES END (INVALID TYPE) ===");
                return;
            }
            $this->log("API endpoint: $endpoint");
            
            // Fetch data from API-Sports
            $this->log("Starting API request...");
            $data = $this->fetchFromAPI($endpoint);
            if (!$data) {
                $this->log("ERROR: Failed to fetch data from API");
                $this->log("=== FETCH MATCHES END (API FAILED) ===");
                return;
            }
            
            $this->log("API request successful");
            $this->log("Response contains " . count($data['response'] ?? []) . " matches");
            
            // Process and save matches
            $this->log("Starting to process matches...");
            $savedCount = $this->processMatches($data['response'] ?? []);
            $this->log("Processed and saved $savedCount matches");
            
            // Update cache metadata
            $this->log("Updating cache metadata...");
            $cacheData = [
                'endpoint' => $endpoint,
                'matches_count' => $savedCount,
                'api_requests_today' => $this->db->getApiRequestsToday() + 1,
                'last_fetch' => date('Y-m-d H:i:s')
            ];
            
            // Use database directly for cache metadata
            $this->db->query(
                "INSERT INTO cache_metadata (cache_key, last_update, data, api_requests_today, total_api_requests) 
                 VALUES (?, NOW(), ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                 last_update = NOW(), 
                 data = VALUES(data),
                 api_requests_today = api_requests_today + 1,
                 total_api_requests = total_api_requests + 1",
                [$type, json_encode($cacheData), $this->db->getApiRequestsToday() + 1, 1]
            );
            
            $this->log("Cache metadata updated");
            
            // Increment API request counter
            $this->db->incrementApiRequests($type);
            $this->log("API request counter incremented");
            
            $duration = round((microtime(true) - $startTime) * 1000);
            $this->log("=== FETCH MATCHES SUCCESS ===");
            $this->log("Processed $savedCount matches for $type in {$duration}ms");
            $this->log("New API usage: " . ($requestsToday + 1) . "/" . MAX_API_REQUESTS_PER_DAY);
            
        } catch (Exception $e) {
            $this->log("=== FETCH MATCHES ERROR ===");
            $this->log("ERROR: " . $e->getMessage());
            $this->log("Stack trace: " . $e->getTraceAsString());
        }
        
        $this->log("=== FETCH MATCHES END ===");
    }
    
    private function shouldUpdate($type) {
        $this->log("Checking if cache update needed for: $type");
        
        try {
            // Check cache_metadata table directly
            $stmt = $this->db->query(
                "SELECT cache_key, last_update, 
                 TIMESTAMPDIFF(MINUTE, last_update, NOW()) as age_minutes 
                 FROM cache_metadata WHERE cache_key = ?",
                [$type]
            );
            $cacheInfo = $stmt->fetch();
            
            if (!$cacheInfo) {
                $this->log("No cache found for $type - update needed");
                return true;
            }
            
            $ageMinutes = $cacheInfo['age_minutes'];
            $this->log("Cache age for $type: {$ageMinutes} minutes");
            $this->log("Last update: " . $cacheInfo['last_update']);
            
            $updateNeeded = false;
            switch ($type) {
                case 'live':
                    $updateNeeded = $ageMinutes >= CACHE_LIVE_MATCHES;
                    $this->log("Live cache threshold: " . CACHE_LIVE_MATCHES . " minutes");
                    break;
                case 'today':
                    $updateNeeded = $ageMinutes >= CACHE_TODAY_MATCHES;
                    $this->log("Today cache threshold: " . CACHE_TODAY_MATCHES . " minutes");
                    break;
                case 'tomorrow':
                    $updateNeeded = $ageMinutes >= CACHE_TOMORROW_MATCHES;
                    $this->log("Tomorrow cache threshold: " . CACHE_TOMORROW_MATCHES . " minutes");
                    break;
                default:
                    $updateNeeded = $ageMinutes >= 60;
                    $this->log("Default cache threshold: 60 minutes");
            }
            
            $this->log("Update needed: " . ($updateNeeded ? 'YES' : 'NO'));
            return $updateNeeded;
            
        } catch (Exception $e) {
            $this->log("Error checking cache: " . $e->getMessage());
            return true; // Default to updating if we can't check
        }
    }
    
    private function getAPIEndpoint($type, $popularOnly = true) {
        $baseEndpoint = '';
        
        switch ($type) {
            case 'live':
                $baseEndpoint = '/fixtures?live=all';
                break;
            case 'today':
                $baseEndpoint = '/fixtures?date=' . date('Y-m-d');
                break;
            case 'tomorrow':
                $tomorrow = date('Y-m-d', strtotime('+1 day'));
                $baseEndpoint = '/fixtures?date=' . $tomorrow;
                break;
            case 'leagues':
                return '/leagues';
            default:
                return null;
        }
        
        // Add league filtering for popular leagues only
        if ($popularOnly && in_array($type, ['live', 'today', 'tomorrow'])) {
            $popularLeagueIds = PopularLeagues::getAllPopularLeagueIds();
            
            // API-Sports allows multiple league IDs separated by hyphens
            // We'll fetch tier 1 leagues first (most important)
            $tier1Leagues = PopularLeagues::getTier1LeagueIds();
            
            // Limit to first 10 leagues to avoid URL length issues
            $leagueIds = array_slice($tier1Leagues, 0, 10);
            $leagueParam = implode('-', $leagueIds);
            
            $baseEndpoint .= '&league=' . $leagueParam;
            
            $this->log("Filtering for popular leagues (Tier 1): " . $leagueParam);
        }
        
        return $baseEndpoint;
    }
    
    private function fetchFromAPI($endpoint) {
        $url = API_SPORTS_BASE_URL . $endpoint;
        $this->log("Full API URL: $url");
        $this->log("API Key: " . substr(API_SPORTS_KEY, 0, 8) . "...");
        $this->log("Request headers: " . API_SPORTS_HEADER . ": " . substr(API_SPORTS_KEY, 0, 8) . "...");
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_HTTPHEADER => [
                API_SPORTS_HEADER . ': ' . API_SPORTS_KEY,
                'User-Agent: YallaFoot/1.0',
                'Accept: application/json'
            ],
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_VERBOSE => false
        ]);
        
        $this->log("Executing cURL request...");
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        $info = curl_getinfo($ch);
        curl_close($ch);
        
        $this->log("cURL response received");
        $this->log("HTTP Code: $httpCode");
        $this->log("Response size: " . strlen($response) . " bytes");
        $this->log("Total time: " . round($info['total_time'], 3) . "s");
        
        if ($error) {
            $this->log("cURL error: $error");
            return false;
        }
        
        if ($httpCode !== 200) {
            $this->log("HTTP error: $httpCode");
            $this->log("Response body: " . substr($response, 0, 500));
            return false;
        }
        
        $this->log("Parsing JSON response...");
        $data = json_decode($response, true);
        if (!$data) {
            $this->log("Failed to decode JSON response");
            $this->log("JSON error: " . json_last_error_msg());
            $this->log("Response preview: " . substr($response, 0, 200));
            return false;
        }
        
        $this->log("JSON parsed successfully");
        
        if (!empty($data['errors'])) {
            $this->log("API errors found: " . implode(', ', $data['errors']));
            return false;
        }
        
        $resultCount = $data['results'] ?? count($data['response'] ?? []);
        $this->log("API response success: $resultCount results");
        
        // Log first match for debugging (if exists)
        if (!empty($data['response'][0])) {
            $firstMatch = $data['response'][0];
            $this->log("First match preview: " . json_encode([
                'id' => $firstMatch['fixture']['id'] ?? 'N/A',
                'date' => $firstMatch['fixture']['date'] ?? 'N/A',
                'status' => $firstMatch['fixture']['status']['short'] ?? 'N/A',
                'home' => $firstMatch['teams']['home']['name'] ?? 'N/A',
                'away' => $firstMatch['teams']['away']['name'] ?? 'N/A'
            ]));
        }
        
        return $data;
    }
    
    private function processMatches($matches) {
        $this->log("Processing " . count($matches) . " matches");
        $savedCount = 0;
        $errorCount = 0;
        
        foreach ($matches as $index => $matchData) {
            try {
                $this->log("Processing match " . ($index + 1) . "...");
                
                // Log match details for debugging
                $matchId = $matchData['fixture']['id'] ?? 'unknown';
                $homeTeam = $matchData['teams']['home']['name'] ?? 'Unknown';
                $awayTeam = $matchData['teams']['away']['name'] ?? 'Unknown';
                $matchDate = $matchData['fixture']['date'] ?? 'Unknown';
                
                $this->log("Match ID: $matchId, $homeTeam vs $awayTeam, Date: $matchDate");
                
                // Process match data manually since MatchManager might not exist
                $result = $this->saveMatchDirectly($matchData);
                
                if ($result) {
                    $savedCount++;
                    $this->log("Match $matchId saved successfully");
                } else {
                    $errorCount++;
                    $this->log("Failed to save match $matchId");
                }
                
            } catch (Exception $e) {
                $errorCount++;
                $this->log("Error processing match " . ($index + 1) . ": " . $e->getMessage());
            }
        }
        
        $this->log("Match processing complete: $savedCount saved, $errorCount errors");
        return $savedCount;
    }
    
    private function saveMatchDirectly($matchData) {
        try {
            // Extract match data
            $fixture = $matchData['fixture'] ?? [];
            $teams = $matchData['teams'] ?? [];
            $league = $matchData['league'] ?? [];
            $goals = $matchData['goals'] ?? [];
            
            $this->log("Processing match data structure:");
            $this->log("- Fixture ID: " . ($fixture['id'] ?? 'missing'));
            $this->log("- League: " . ($league['name'] ?? 'missing') . " (ID: " . ($league['id'] ?? 'missing') . ")");
            $this->log("- Home team: " . ($teams['home']['name'] ?? 'missing') . " (ID: " . ($teams['home']['id'] ?? 'missing') . ")");
            $this->log("- Away team: " . ($teams['away']['name'] ?? 'missing') . " (ID: " . ($teams['away']['id'] ?? 'missing') . ")");
            
            // Insert or update teams first
            $this->log("Saving home team...");
            $homeTeamId = $this->saveTeam($teams['home'] ?? []);
            
            $this->log("Saving away team...");
            $awayTeamId = $this->saveTeam($teams['away'] ?? []);
            
            // Insert or update league
            $this->log("Saving league...");
            $leagueId = $this->saveLeague($league);
            
            $this->log("Team/League save results: Home=$homeTeamId, Away=$awayTeamId, League=$leagueId");
            
            // Insert or update match
            $matchId = $fixture['id'] ?? null;
            if (!$matchId) {
                $this->log("ERROR: No match ID found in fixture data");
                return false;
            }
            
            $isLive = in_array($fixture['status']['short'] ?? '', ['1H', '2H', 'HT', 'ET', 'P']);
            
            $this->log("Saving match to database...");
            $this->log("- Match ID: $matchId");
            $this->log("- League ID: $leagueId");
            $this->log("- Home Team ID: $homeTeamId");  
            $this->log("- Away Team ID: $awayTeamId");
            $this->log("- Is Live: " . ($isLive ? 'YES' : 'NO'));
            
            $this->db->query(
                "INSERT INTO matches (
                    id, league_id, home_team_id, away_team_id, match_date, match_timestamp,
                    status_short, status_long, elapsed, venue_name, venue_city,
                    home_score, away_score, is_live, referee, round_name, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                ON DUPLICATE KEY UPDATE
                    status_short = VALUES(status_short),
                    status_long = VALUES(status_long),
                    elapsed = VALUES(elapsed),
                    home_score = VALUES(home_score),
                    away_score = VALUES(away_score),
                    is_live = VALUES(is_live),
                    updated_at = NOW()",
                [
                    $matchId,
                    $leagueId,
                    $homeTeamId,
                    $awayTeamId,
                    $fixture['date'] ?? null,
                    $fixture['timestamp'] ?? null,
                    $fixture['status']['short'] ?? null,
                    $fixture['status']['long'] ?? null,
                    $fixture['status']['elapsed'] ?? null,
                    $fixture['venue']['name'] ?? null,
                    $fixture['venue']['city'] ?? null,
                    $goals['home'] ?? null,
                    $goals['away'] ?? null,
                    $isLive,
                    $fixture['referee'] ?? null,
                    $league['round'] ?? null
                ]
            );
            
            $this->log("Match $matchId saved successfully to database!");
            return true;
            
        } catch (Exception $e) {
            $this->log("ERROR saving match directly: " . $e->getMessage());
            $this->log("Stack trace: " . $e->getTraceAsString());
            return false;
        }
    }
    
    private function saveTeam($teamData) {
        if (empty($teamData['id']) || empty($teamData['name'])) {
            $this->log("Skipping team - missing ID or name");
            return null;
        }
        
        // Handle missing country data
        $country = null;
        if (isset($teamData['country']['name']) && !empty($teamData['country']['name'])) {
            $country = $teamData['country']['name'];
        }
        
        $this->log("Saving team: " . $teamData['name'] . " (Country: " . ($country ?? 'Unknown') . ")");
        
        $this->db->query(
            "INSERT INTO teams (id, name, logo, founded, country, updated_at)
             VALUES (?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                logo = VALUES(logo),
                updated_at = NOW()",
            [
                $teamData['id'],
                $teamData['name'],
                $teamData['logo'] ?? null,
                $teamData['founded'] ?? null,
                $country  // Can be null for teams table
            ]
        );
        
        return $teamData['id'];
    }
    
    private function saveLeague($leagueData) {
        if (empty($leagueData['id']) || empty($leagueData['name'])) {
            $this->log("Skipping league - missing ID or name");
            return null;
        }
        
        // Handle missing country data
        $country = null;
        if (isset($leagueData['country']['name']) && !empty($leagueData['country']['name'])) {
            $country = $leagueData['country']['name'];
        }
        
        // If country is still null, use a default value
        if (is_null($country)) {
            $country = 'Unknown';
        }
        
        $this->log("Saving league: " . $leagueData['name'] . " (Country: $country)");
        
        $this->db->query(
            "INSERT INTO leagues (id, name, country, logo, flag, season, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE
                name = VALUES(name),
                country = VALUES(country),
                logo = VALUES(logo),
                flag = VALUES(flag),
                season = VALUES(season),
                updated_at = NOW()",
            [
                $leagueData['id'],
                $leagueData['name'],
                $country,  // Now guaranteed to not be null
                $leagueData['logo'] ?? null,
                $leagueData['country']['flag'] ?? null,
                $leagueData['season'] ?? null
            ]
        );
        
        return $leagueData['id'];
    }
    
    private function log($message) {
        $timestamp = date('Y-m-d H:i:s');
        $logMessage = "[$timestamp] $message\n";
        
        echo $logMessage; // For cron job output
        
        if (ENABLE_LOGGING) {
            // Ensure log directory exists
            $logDir = dirname($this->logFile);
            if (!is_dir($logDir)) {
                mkdir($logDir, 0755, true);
            }
            
            file_put_contents($this->logFile, $logMessage, FILE_APPEND | LOCK_EX);
        }
    }
}

// Main execution
if (isset($argv[1])) {
    $type = $argv[1];
    $fetcher = new MatchFetcher();
    $fetcher->fetchMatches($type);
} else {
    echo "Usage: php fetch-matches.php [live|today|tomorrow|leagues]\n";
    exit(1);
}
?>
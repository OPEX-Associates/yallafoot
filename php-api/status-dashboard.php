<?php
/**
 * YallaFoot PHP API - Status Dashboard
 * Real-time monitoring of API health, cache status, and recent updates
 */

// Include required files
require_once 'config/database.php';
require_once 'config/api-config.php';
require_once 'classes/Database.php';
require_once 'classes/MatchManager.php';

// Initialize database
$db = Database::getInstance();
$matchManager = new MatchManager($db);

// Get status data
function getApiStatus($db) {
    try {
        // Test database connection
        $stmt = $db->getConnection()->query("SELECT COUNT(*) as total_matches FROM matches");
        $totalMatches = $stmt->fetch(PDO::FETCH_ASSOC)['total_matches'];
        
        // Get cache statistics from cache_metadata table
        $stmt = $db->getConnection()->query("
            SELECT 
                cache_key,
                last_update,
                api_requests_today,
                total_api_requests
            FROM cache_metadata 
            ORDER BY last_update DESC
        ");
        $cacheStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get latest matches with team names and league info
        $stmt = $db->getConnection()->query("
            SELECT 
                m.match_date,
                m.status_short,
                m.status_long,
                ht.name as home_team,
                at.name as away_team,
                l.name as league_name,
                m.created_at
            FROM matches m
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 10
        ");
        $latestMatches = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Get today's live matches count
        $stmt = $db->getConnection()->query("
            SELECT COUNT(*) as live_count 
            FROM matches 
            WHERE DATE(match_date) = CURDATE() 
            AND is_live = TRUE
        ");
        $liveCount = $stmt->fetch(PDO::FETCH_ASSOC)['live_count'];
        
        // Get database size
        $stmt = $db->getConnection()->query("
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
        ");
        $dbSize = $stmt->fetch(PDO::FETCH_ASSOC)['size_mb'];
        
        // Get additional statistics
        $stmt = $db->getConnection()->query("SELECT COUNT(*) as total_teams FROM teams");
        $totalTeams = $stmt->fetch(PDO::FETCH_ASSOC)['total_teams'];
        
        $stmt = $db->getConnection()->query("SELECT COUNT(*) as total_leagues FROM leagues");
        $totalLeagues = $stmt->fetch(PDO::FETCH_ASSOC)['total_leagues'];
        
        // Get today's matches count
        $stmt = $db->getConnection()->query("
            SELECT COUNT(*) as today_matches 
            FROM matches 
            WHERE DATE(match_date) = CURDATE()
        ");
        $todayMatches = $stmt->fetch(PDO::FETCH_ASSOC)['today_matches'];
        
        return [
            'status' => 'healthy',
            'total_matches' => $totalMatches,
            'total_teams' => $totalTeams,
            'total_leagues' => $totalLeagues,
            'today_matches' => $todayMatches,
            'cache_stats' => $cacheStats,
            'latest_matches' => $latestMatches,
            'live_count' => $liveCount,
            'db_size_mb' => $dbSize,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
    } catch (Exception $e) {
        return [
            'status' => 'error',
            'error' => $e->getMessage(),
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Get API-Sports status
function getExternalApiStatus() {
    $url = 'https://v3.football.api-sports.io/status';
    $headers = [
        'x-apisports-key: ' . API_SPORTS_KEY
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200 && $response) {
        $data = json_decode($response, true);
        return $data['response'] ?? null;
    }
    
    return null;
}

$status = getApiStatus($db);
$externalApiStatus = getExternalApiStatus();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YallaFoot API - Status Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .card:hover {
            transform: translateY(-5px);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .card-icon {
            width: 24px;
            height: 24px;
            margin-right: 10px;
        }
        
        .card-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2d3748;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-healthy {
            background: #48bb78;
            color: white;
        }
        
        .status-error {
            background: #f56565;
            color: white;
        }
        
        .status-warning {
            background: #ed8936;
            color: white;
        }
        
        .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .metric:last-child {
            border-bottom: none;
        }
        
        .metric-label {
            color: #718096;
            font-size: 0.9rem;
        }
        
        .metric-value {
            font-weight: 600;
            color: #2d3748;
        }
        
        .matches-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        
        .matches-table th,
        .matches-table td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
            font-size: 0.85rem;
        }
        
        .matches-table th {
            background: #f7fafc;
            font-weight: 600;
            color: #4a5568;
        }
        
        .live-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #48bb78;
            border-radius: 50%;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .refresh-btn {
            background: #4299e1;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: background 0.2s;
        }
        
        .refresh-btn:hover {
            background: #3182ce;
        }
        
        .timestamp {
            text-align: center;
            color: white;
            opacity: 0.8;
            margin-top: 20px;
            font-size: 0.9rem;
        }
        
        .full-width {
            grid-column: 1 / -1;
        }
        
        .api-requests {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        
        .api-requests .card-header {
            border-bottom-color: rgba(255,255,255,0.2);
        }
        
        .api-requests .metric {
            border-bottom-color: rgba(255,255,255,0.1);
        }
        
        .api-requests .metric-label {
            color: rgba(255,255,255,0.8);
        }
        
        .api-requests .metric-value {
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚽ YallaFoot API Dashboard</h1>
            <p>Real-time monitoring of your football data API</p>
        </div>
        
        <div class="dashboard-grid">
            <!-- System Status Card -->
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">🏥</span>
                    <span class="card-title">System Health</span>
                    <span class="status-badge <?php echo $status['status'] === 'healthy' ? 'status-healthy' : 'status-error'; ?>">
                        <?php echo $status['status']; ?>
                    </span>
                </div>
                
                <?php if ($status['status'] === 'healthy'): ?>
                    <div class="metric">
                        <span class="metric-label">Total Matches</span>
                        <span class="metric-value"><?php echo number_format($status['total_matches']); ?></span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Today's Matches</span>
                        <span class="metric-value"><?php echo number_format($status['today_matches']); ?></span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Live Matches</span>
                        <span class="metric-value">
                            <?php if ($status['live_count'] > 0): ?>
                                <span class="live-indicator"></span>
                            <?php endif; ?>
                            <?php echo $status['live_count']; ?>
                        </span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Teams</span>
                        <span class="metric-value"><?php echo number_format($status['total_teams']); ?></span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Leagues</span>
                        <span class="metric-value"><?php echo number_format($status['total_leagues']); ?></span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Database Size</span>
                        <span class="metric-value"><?php echo $status['db_size_mb']; ?> MB</span>
                    </div>
                <?php else: ?>
                    <div style="color: #f56565; font-weight: 600;">
                        Error: <?php echo htmlspecialchars($status['error']); ?>
                    </div>
                <?php endif; ?>
            </div>
            
            <!-- External API Status -->
            <?php if ($externalApiStatus): ?>
            <div class="card api-requests">
                <div class="card-header">
                    <span class="card-icon">🌐</span>
                    <span class="card-title">API-Sports Status</span>
                    <span class="status-badge status-healthy">Connected</span>
                </div>
                
                <div class="metric">
                    <span class="metric-label">Requests Today</span>
                    <span class="metric-value"><?php echo $externalApiStatus['requests']['current']; ?> / <?php echo $externalApiStatus['requests']['limit_day']; ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Account Type</span>
                    <span class="metric-value"><?php echo ucfirst($externalApiStatus['account']['firstname'] ?? 'Free'); ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Subscription</span>
                    <span class="metric-value"><?php echo ucfirst($externalApiStatus['subscription']['plan'] ?? 'Free'); ?></span>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Cache Statistics -->
            <?php if (!empty($status['cache_stats'])): ?>
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">⚡</span>
                    <span class="card-title">Cache Performance</span>
                </div>
                
                <?php foreach ($status['cache_stats'] as $cache): ?>
                <div class="metric">
                    <span class="metric-label"><?php echo ucfirst(str_replace('_', ' ', $cache['cache_key'])); ?></span>
                    <span class="metric-value">
                        <?php 
                        $lastUpdated = new DateTime($cache['last_update']);
                        $now = new DateTime();
                        $diff = $now->diff($lastUpdated);
                        
                        if ($diff->h > 0) {
                            echo $diff->h . 'h ' . $diff->i . 'm ago';
                        } elseif ($diff->i > 0) {
                            echo $diff->i . 'm ago';
                        } else {
                            echo 'Just now';
                        }
                        ?>
                    </span>
                </div>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
            
            <!-- API Usage Statistics -->
            <?php if (!empty($status['cache_stats'])): ?>
            <div class="card">
                <div class="card-header">
                    <span class="card-icon">📊</span>
                    <span class="card-title">API Usage Today</span>
                </div>
                
                <?php 
                $totalRequestsToday = 0;
                $totalRequestsAll = 0;
                foreach ($status['cache_stats'] as $cache) {
                    $totalRequestsToday += $cache['api_requests_today'];
                    $totalRequestsAll += $cache['total_api_requests'];
                }
                ?>
                
                <div class="metric">
                    <span class="metric-label">Requests Today</span>
                    <span class="metric-value"><?php echo $totalRequestsToday; ?> / 100</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Total Requests</span>
                    <span class="metric-value"><?php echo number_format($totalRequestsAll); ?></span>
                </div>
                <div class="metric">
                    <span class="metric-label">Remaining Today</span>
                    <span class="metric-value" style="color: <?php echo ($totalRequestsToday > 80) ? '#f56565' : '#48bb78'; ?>">
                        <?php echo (100 - $totalRequestsToday); ?>
                    </span>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Latest Matches -->
            <?php if (!empty($status['latest_matches'])): ?>
            <div class="card full-width">
                <div class="card-header">
                    <span class="card-icon">⚽</span>
                    <span class="card-title">Latest Match Updates</span>
                    <button class="refresh-btn" onclick="location.reload()">🔄 Refresh</button>
                </div>
                
                <table class="matches-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Match</th>
                            <th>League</th>
                            <th>Status</th>
                            <th>Updated</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($status['latest_matches'] as $match): ?>
                        <tr>
                            <td><?php echo date('M j', strtotime($match['match_date'])); ?></td>
                            <td>
                                <strong><?php echo htmlspecialchars($match['home_team'] ?? 'TBD'); ?></strong>
                                vs
                                <strong><?php echo htmlspecialchars($match['away_team'] ?? 'TBD'); ?></strong>
                            </td>
                            <td><?php echo htmlspecialchars($match['league_name'] ?? 'Unknown'); ?></td>
                            <td>
                                <?php if (in_array($match['status_short'], ['1H', '2H', 'HT', 'ET', 'P'])): ?>
                                    <span class="live-indicator"></span>
                                <?php endif; ?>
                                <?php echo htmlspecialchars($match['status_short'] ?? $match['status_long'] ?? 'NS'); ?>
                            </td>
                            <td>
                                <?php 
                                $created = new DateTime($match['created_at']);
                                echo $created->format('H:i');
                                ?>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
        
        <div class="timestamp">
            Last updated: <?php echo $status['timestamp']; ?>
            | Auto-refresh every 30 seconds
        </div>
    </div>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {
            location.reload();
        }, 30000);
        
        // Add some interactive features
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', function() {
                this.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
            });
        });
    </script>
</body>
</html>
<?php
/**
 * Match Data Manager
 */

// Include popular leagues configuration
require_once __DIR__ . '/../config/popular-leagues.php';

class MatchManager {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function getLiveMatches($popularOnly = false) {
        if ($popularOnly) {
            return $this->getPopularLiveMatches();
        }
        return $this->db->fetchAll("SELECT * FROM live_matches_view ORDER BY match_date ASC");
    }
    
    public function getTodayMatches($popularOnly = false) {
        if ($popularOnly) {
            return $this->getPopularTodayMatches();
        }
        return $this->db->fetchAll("SELECT * FROM today_matches_view ORDER BY match_date ASC");
    }
    
    /**
     * Get live matches from popular leagues only
     */
    public function getPopularLiveMatches($tier = null) {
        $whereClause = $tier === 1 
            ? PopularLeagues::getTier1LeaguesWhereClause('m')
            : PopularLeagues::getPopularLeaguesWhereClause('m');
            
        $sql = "
            SELECT 
                m.id,
                m.match_date,
                m.status_short,
                m.status_long,
                m.elapsed,
                m.home_score,
                m.away_score,
                m.venue_name,
                m.is_live,
                ht.name as home_team_name,
                ht.logo as home_team_logo,
                at.name as away_team_name,
                at.logo as away_team_logo,
                l.name as league_name,
                l.country as league_country,
                l.logo as league_logo
            FROM matches m
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            WHERE m.is_live = TRUE AND {$whereClause}
            ORDER BY m.match_date ASC
        ";
        
        return $this->db->fetchAll($sql);
    }
    
    /**
     * Get today's matches from popular leagues only
     */
    public function getPopularTodayMatches($tier = null) {
        $whereClause = $tier === 1 
            ? PopularLeagues::getTier1LeaguesWhereClause('m')
            : PopularLeagues::getPopularLeaguesWhereClause('m');
            
        $sql = "
            SELECT 
                m.id,
                m.match_date,
                m.status_short,
                m.status_long,
                m.elapsed,
                m.home_score,
                m.away_score,
                m.venue_name,
                m.is_live,
                ht.name as home_team_name,
                ht.logo as home_team_logo,
                at.name as away_team_name,
                at.logo as away_team_logo,
                l.name as league_name,
                l.country as league_country,
                l.logo as league_logo
            FROM matches m
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            WHERE DATE(m.match_date) = CURDATE() AND {$whereClause}
            ORDER BY m.match_date ASC
        ";
        
        return $this->db->fetchAll($sql);
    }
    
    public function getTomorrowMatches($popularOnly = false, $tier = null) {
        $whereClause = "DATE(m.match_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY)";
        
        if ($popularOnly) {
            $leagueFilter = $tier === 1 
                ? PopularLeagues::getTier1LeaguesWhereClause('m')
                : PopularLeagues::getPopularLeaguesWhereClause('m');
            $whereClause .= " AND {$leagueFilter}";
        }
        
        $sql = "
            SELECT 
                m.id,
                m.match_date,
                m.status_short,
                m.status_long,
                m.elapsed,
                m.home_score,
                m.away_score,
                m.venue_name,
                m.is_live,
                ht.name as home_team_name,
                ht.logo as home_team_logo,
                at.name as away_team_name,
                at.logo as away_team_logo,
                l.name as league_name,
                l.country as league_country,
                l.logo as league_logo
            FROM matches m
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            WHERE {$whereClause}
            ORDER BY m.match_date ASC
        ";
        
        return $this->db->fetchAll($sql);
    }
    
    public function getMatchById($matchId) {
        $sql = "
            SELECT 
                m.*,
                ht.name as home_team_name,
                ht.logo as home_team_logo,
                at.name as away_team_name,
                at.logo as away_team_logo,
                l.name as league_name,
                l.country as league_country,
                l.logo as league_logo
            FROM matches m
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            WHERE m.id = ?
        ";
        
        return $this->db->fetchOne($sql, [$matchId]);
    }
    
    public function saveMatch($matchData) {
        try {
            // Save league if not exists
            if (isset($matchData['league'])) {
                $this->saveLeague($matchData['league']);
            }
            
            // Save teams if not exist
            if (isset($matchData['teams']['home'])) {
                $this->saveTeam($matchData['teams']['home']);
            }
            if (isset($matchData['teams']['away'])) {
                $this->saveTeam($matchData['teams']['away']);
            }
            
            // Prepare match data
            $match = [
                'id' => $matchData['fixture']['id'],
                'league_id' => $matchData['league']['id'],
                'home_team_id' => $matchData['teams']['home']['id'],
                'away_team_id' => $matchData['teams']['away']['id'],
                'match_date' => date('Y-m-d H:i:s', $matchData['fixture']['timestamp']),
                'match_timestamp' => $matchData['fixture']['timestamp'],
                'status_short' => $matchData['fixture']['status']['short'],
                'status_long' => $matchData['fixture']['status']['long'],
                'elapsed' => $matchData['fixture']['status']['elapsed'],
                'venue_name' => $matchData['fixture']['venue']['name'] ?? null,
                'venue_city' => $matchData['fixture']['venue']['city'] ?? null,
                'home_score' => $matchData['goals']['home'],
                'away_score' => $matchData['goals']['away'],
                'is_live' => in_array($matchData['fixture']['status']['short'], ['1H', '2H', 'HT', 'ET', 'P', 'LIVE']) ? 1 : 0,
                'referee' => $matchData['fixture']['referee'] ?? null,
                'round_name' => $matchData['league']['round'] ?? null
            ];
            
            // Save match
            $this->db->insertOrUpdate('matches', $match, [
                'status_short', 'status_long', 'elapsed', 'home_score', 'away_score', 
                'is_live', 'referee', 'updated_at'
            ]);
            
            return true;
            
        } catch (Exception $e) {
            error_log("Failed to save match: " . $e->getMessage());
            return false;
        }
    }
    
    private function saveLeague($leagueData) {
        $league = [
            'id' => $leagueData['id'],
            'name' => $leagueData['name'],
            'country' => $leagueData['country'],
            'logo' => $leagueData['logo'] ?? null,
            'flag' => $leagueData['flag'] ?? null,
            'season' => $leagueData['season'] ?? date('Y')
        ];
        
        $this->db->insertOrUpdate('leagues', $league, ['name', 'logo', 'flag', 'season', 'updated_at']);
    }
    
    private function saveTeam($teamData) {
        $team = [
            'id' => $teamData['id'],
            'name' => $teamData['name'],
            'logo' => $teamData['logo'] ?? null,
            'founded' => $teamData['founded'] ?? null,
            'country' => $teamData['country'] ?? null
        ];
        
        $this->db->insertOrUpdate('teams', $team, ['name', 'logo', 'founded', 'country', 'updated_at']);
    }
    
    public function transformMatchForAPI($match) {
        // Determine if match is live based on status if is_live field is not available
        $isLive = false;
        if (isset($match['is_live'])) {
            $isLive = (bool)$match['is_live'];
        } else {
            // Fallback: determine live status from status_short
            $liveStatuses = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE'];
            $isLive = in_array($match['status_short'], $liveStatuses);
        }
        
        return [
            'id' => (int)$match['id'],
            'homeTeam' => [
                'name' => $match['home_team_name'],
                'logo' => $match['home_team_logo']
            ],
            'awayTeam' => [
                'name' => $match['away_team_name'],
                'logo' => $match['away_team_logo']
            ],
            'score' => [
                'home' => $match['home_score'] !== null ? (int)$match['home_score'] : null,
                'away' => $match['away_score'] !== null ? (int)$match['away_score'] : null
            ],
            'status' => $match['status_short'],
            'statusText' => $match['status_long'],
            'date' => $match['match_date'],
            'venue' => $match['venue_name'],
            'league' => [
                'name' => $match['league_name'],
                'country' => $match['league_country'],
                'logo' => $match['league_logo']
            ],
            'elapsed' => $match['elapsed'] ? (int)$match['elapsed'] : null,
            'isLive' => $isLive
        ];
    }
    
    public function getCacheInfo($cacheKey) {
        $result = $this->db->fetchOne(
            "SELECT * FROM cache_metadata WHERE cache_key = ?",
            [$cacheKey]
        );
        
        if (!$result) {
            return null;
        }
        
        $lastUpdate = strtotime($result['last_update']);
        $ageMinutes = floor((time() - $lastUpdate) / 60);
        
        return [
            'last_update' => $result['last_update'],
            'age_minutes' => $ageMinutes,
            'requests_today' => (int)$result['api_requests_today'],
            'cache_key' => $cacheKey
        ];
    }
    
    public function updateCacheMetadata($cacheKey, $data = null) {
        $updateData = [
            'cache_key' => $cacheKey,
            'last_update' => date('Y-m-d H:i:s'),
            'last_reset_date' => date('Y-m-d')
        ];
        
        if ($data !== null) {
            $updateData['data'] = json_encode($data);
        }
        
        $this->db->insertOrUpdate('cache_metadata', $updateData, ['last_update', 'data']);
    }
}
?>
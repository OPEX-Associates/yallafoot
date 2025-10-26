<?php
/**
 * Popular Leagues Configuration
 * 
 * This file defines which leagues should be prioritized based on global viewership
 * and popularity. Matches from these leagues will be fetched and displayed first.
 */

class PopularLeagues {
    
    /**
     * Top-tier leagues with massive global viewership
     * These should always be included
     */
    const TIER_1_LEAGUES = [
        // England
        39 => 'Premier League',
        
        // Spain  
        140 => 'La Liga',
        
        // Germany
        78 => 'Bundesliga',
        
        // Italy
        135 => 'Serie A',
        
        // France
        61 => 'Ligue 1',
        
        // Champions League & Europa League
        2 => 'UEFA Champions League',
        3 => 'UEFA Europa League',
        848 => 'UEFA Europa Conference League',
        
        // International
        1 => 'World Cup',
        4 => 'UEFA European Championship',
        9 => 'Copa America',
        
        // Brazil
        71 => 'Brasileirão Serie A',
        
        // Argentina  
        128 => 'Liga Argentina',
        
        // Netherlands
        88 => 'Eredivisie',
        
        // Portugal
        94 => 'Primeira Liga',
        
        // USA
        253 => 'Major League Soccer'
    ];
    
    /**
     * Second-tier leagues with good regional/international following
     */
    const TIER_2_LEAGUES = [
        // England
        40 => 'Championship',
        
        // Spain
        141 => 'Segunda División',
        
        // Germany  
        79 => '2. Bundesliga',
        
        // Italy
        136 => 'Serie B',
        
        // France
        62 => 'Ligue 2',
        
        // Turkey
        203 => 'Süper Lig',
        
        // Russia
        235 => 'Premier League',
        
        // Mexico
        262 => 'Liga MX',
        
        // Belgium
        144 => 'Pro League',
        
        // Switzerland  
        207 => 'Super League',
        
        // Austria
        218 => 'Bundesliga',
        
        // Scotland
        179 => 'Premiership',
        
        // Greece
        197 => 'Super League 1',
        
        // Croatia
        210 => '1. HNL',
        
        // Serbia
        286 => 'SuperLiga',
        
        // Saudi Arabia
        307 => 'Pro League',
        
        // Qatar  
        305 => 'Stars League',
        
        // Australia
        188 => 'A-League Men',
        
        // Japan
        98 => 'J1 League',
        
        // South Korea
        292 => 'K League 1'
    ];
    
    /**
     * Get all popular league IDs (Tier 1 + Tier 2)
     */
    public static function getAllPopularLeagueIds() {
        return array_keys(array_merge(self::TIER_1_LEAGUES, self::TIER_2_LEAGUES));
    }
    
    /**
     * Get only top-tier league IDs
     */
    public static function getTier1LeagueIds() {
        return array_keys(self::TIER_1_LEAGUES);
    }
    
    /**
     * Get only second-tier league IDs  
     */
    public static function getTier2LeagueIds() {
        return array_keys(self::TIER_2_LEAGUES);
    }
    
    /**
     * Check if a league ID is popular
     */
    public static function isPopularLeague($leagueId) {
        return in_array($leagueId, self::getAllPopularLeagueIds());
    }
    
    /**
     * Get league tier (1, 2, or null if not popular)
     */
    public static function getLeagueTier($leagueId) {
        if (array_key_exists($leagueId, self::TIER_1_LEAGUES)) {
            return 1;
        }
        if (array_key_exists($leagueId, self::TIER_2_LEAGUES)) {
            return 2;
        }
        return null;
    }
    
    /**
     * Get league name by ID
     */
    public static function getLeagueName($leagueId) {
        $allLeagues = array_merge(self::TIER_1_LEAGUES, self::TIER_2_LEAGUES);
        return $allLeagues[$leagueId] ?? null;
    }
    
    /**
     * Get SQL WHERE clause for filtering popular leagues
     */
    public static function getPopularLeaguesWhereClause($tableAlias = 'm') {
        $leagueIds = implode(',', self::getAllPopularLeagueIds());
        return "{$tableAlias}.league_id IN ({$leagueIds})";
    }
    
    /**
     * Get SQL WHERE clause for filtering only top-tier leagues
     */
    public static function getTier1LeaguesWhereClause($tableAlias = 'm') {
        $leagueIds = implode(',', self::getTier1LeagueIds());
        return "{$tableAlias}.league_id IN ({$leagueIds})";
    }
}
?>
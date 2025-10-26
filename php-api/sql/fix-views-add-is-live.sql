-- Fix database views to include is_live field
-- This will resolve the PHP warnings about undefined 'is_live' array key

-- Update live_matches_view to include is_live field
CREATE OR REPLACE VIEW live_matches_view AS
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
WHERE m.is_live = TRUE
ORDER BY m.match_date ASC;

-- Update today_matches_view to include is_live field
CREATE OR REPLACE VIEW today_matches_view AS
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
WHERE DATE(m.match_date) = CURDATE()
ORDER BY m.match_date ASC;

-- Update is_live field based on status for existing matches
UPDATE matches 
SET is_live = CASE 
    WHEN status_short IN ('1H', '2H', 'HT', 'ET', 'P', 'LIVE') THEN TRUE
    ELSE FALSE
END
WHERE is_live IS NULL OR is_live = 0;

-- Verify the fixes
SELECT 'Live matches count:' as info, COUNT(*) as count FROM live_matches_view
UNION ALL
SELECT 'Today matches count:' as info, COUNT(*) as count FROM today_matches_view
UNION ALL
SELECT 'Matches with is_live=1:' as info, COUNT(*) as count FROM matches WHERE is_live = 1;
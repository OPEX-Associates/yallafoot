-- YallaFoot Database Schema
-- Run this in your cPanel phpMyAdmin or MySQL interface

-- Create leagues table
CREATE TABLE IF NOT EXISTS leagues (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    logo VARCHAR(500),
    flag VARCHAR(500),
    season INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_country (country),
    INDEX idx_season (season)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id INT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    founded INT,
    country VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_country (country),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create matches table (main table)
CREATE TABLE IF NOT EXISTS matches (
    id INT PRIMARY KEY,
    league_id INT,
    home_team_id INT,
    away_team_id INT,
    match_date DATETIME NOT NULL,
    match_timestamp INT,
    status_short VARCHAR(10),
    status_long VARCHAR(100),
    elapsed INT,
    venue_name VARCHAR(255),
    venue_city VARCHAR(100),
    home_score INT DEFAULT NULL,
    away_score INT DEFAULT NULL,
    is_live BOOLEAN DEFAULT FALSE,
    referee VARCHAR(255),
    round_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE SET NULL,
    FOREIGN KEY (home_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (away_team_id) REFERENCES teams(id) ON DELETE SET NULL,
    
    INDEX idx_match_date (match_date),
    INDEX idx_status (status_short),
    INDEX idx_is_live (is_live),
    INDEX idx_league (league_id),
    INDEX idx_teams (home_team_id, away_team_id),
    INDEX idx_match_timestamp (match_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create cache metadata table
CREATE TABLE IF NOT EXISTS cache_metadata (
    cache_key VARCHAR(50) PRIMARY KEY,
    last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    api_requests_today INT DEFAULT 0,
    total_api_requests INT DEFAULT 0,
    last_reset_date DATE DEFAULT (CURDATE()),
    data JSON,
    INDEX idx_last_update (last_update),
    INDEX idx_reset_date (last_reset_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create API logs table
CREATE TABLE IF NOT EXISTS api_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    ip_address VARCHAR(45),
    user_agent TEXT,
    response_time_ms INT,
    status_code INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_created_at (created_at),
    INDEX idx_endpoint (endpoint),
    INDEX idx_status_code (status_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert initial cache metadata
INSERT INTO cache_metadata (cache_key, api_requests_today, total_api_requests) 
VALUES 
    ('live_matches', 0, 0),
    ('today_matches', 0, 0),
    ('tomorrow_matches', 0, 0),
    ('leagues', 0, 0)
ON DUPLICATE KEY UPDATE cache_key = cache_key;

-- Create optimized views for common queries
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

-- Grant permissions (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON yallafoot.* TO 'your_api_user'@'localhost';

-- Performance optimization
ANALYZE TABLE matches, teams, leagues, cache_metadata;
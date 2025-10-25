<?php
// Quick fix for the PHP API errors
// This file contains the corrected MatchManager code to upload to the server

// Add error suppression at the start of index.php
echo "// Add this to the top of index.php:\n";
echo "<?php\n";
echo "error_reporting(0);\n";
echo "ini_set('display_errors', 0);\n";
echo "\n";

// Fix for MatchManager.php - line 169 issue
echo "// Fix for MatchManager.php around line 169:\n";
echo "// Replace the line with 'is_live' check with:\n";
echo "\$isLive = isset(\$match['is_live']) ? \$match['is_live'] : false;\n";
echo "\n";

// Complete fixed method for transforming match data
echo "// Complete fixed transformMatch method:\n";
?>

public function transformMatch($match) {
    // Handle missing keys with defaults
    $isLive = isset($match['is_live']) ? $match['is_live'] : false;
    $elapsed = isset($match['elapsed']) ? $match['elapsed'] : null;
    
    return [
        'id' => $match['id'],
        'homeTeam' => [
            'name' => $match['home_team_name'] ?? 'Home Team',
            'logo' => $match['home_team_logo'] ?? '',
            'id' => $match['home_team_id'] ?? 0
        ],
        'awayTeam' => [
            'name' => $match['away_team_name'] ?? 'Away Team', 
            'logo' => $match['away_team_logo'] ?? '',
            'id' => $match['away_team_id'] ?? 0
        ],
        'score' => [
            'home' => $match['home_score'],
            'away' => $match['away_score']
        ],
        'status' => $match['status'] ?? 'NS',
        'statusText' => $match['status_text'] ?? 'Not Started',
        'date' => $match['match_date'],
        'venue' => $match['venue'] ?? 'TBD',
        'league' => [
            'name' => $match['league_name'] ?? 'Unknown League',
            'country' => $match['league_country'] ?? 'Unknown',
            'logo' => $match['league_logo'] ?? ''
        ],
        'elapsed' => $elapsed,
        'isLive' => $isLive
    ];
}

<?php
echo "\n// Instructions:\n";
echo "// 1. Add error suppression to index.php\n";
echo "// 2. Fix the is_live check in MatchManager.php\n";
echo "// 3. Test the API endpoint again\n";
?>
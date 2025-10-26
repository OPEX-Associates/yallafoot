<?php
/**
 * Test script to verify API-Sports league parameter format
 */

// Test different league parameter formats
$testFormats = [
    'single_with_season' => '/fixtures?date=2025-10-26&league=39&season=2025',
    'multiple_with_season' => '/fixtures?date=2025-10-26&league=39&season=2025&league=140&season=2025',
    'live_all' => '/fixtures?live=all'
];

echo "Testing API-Sports league parameter formats:\n\n";

foreach ($testFormats as $name => $endpoint) {
    echo "Format: $name\n";
    echo "URL: https://v3.football.api-sports.io$endpoint\n";
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => 'https://v3.football.api-sports.io' . $endpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'x-apisports-key: 2d82524e5b7054f7d93825e696a35074'
        ]
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if ($httpCode === 200 && !isset($data['errors'])) {
        echo "✅ SUCCESS: " . count($data['response'] ?? []) . " matches found\n";
    } else {
        echo "❌ FAILED (HTTP $httpCode): ";
        if (isset($data['errors'])) {
            echo implode(', ', $data['errors']) . "\n";
        } else {
            echo "Response: " . substr($response, 0, 200) . "\n";
        }
    }
    echo "\n";
}

echo "Testing live endpoint (no league filtering):\n";
$liveEndpoint = '/fixtures?live=all';
echo "URL: https://v3.football.api-sports.io$liveEndpoint\n";

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => 'https://v3.football.api-sports.io' . $liveEndpoint,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_HTTPHEADER => [
        'x-apisports-key: 2d82524e5b7054f7d93825e696a35074'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$data = json_decode($response, true);

if ($httpCode === 200 && !isset($data['errors'])) {
    echo "✅ SUCCESS: " . count($data['response'] ?? []) . " live matches found\n";
    
    // Show which leagues are currently live
    $leagues = [];
    foreach ($data['response'] ?? [] as $match) {
        $leagueId = $match['league']['id'];
        $leagueName = $match['league']['name'];
        $leagues[$leagueId] = $leagueName;
    }
    
    echo "Live leagues: " . count($leagues) . " different leagues\n";
    foreach (array_slice($leagues, 0, 10, true) as $id => $name) {
        echo "  $id: $name\n";
    }
} else {
    echo "❌ FAILED: " . ($data['errors'][0] ?? 'Unknown error') . "\n";
}
?>
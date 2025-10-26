<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Get match ID from request
$matchId = $_GET['id'] ?? '';

if (empty($matchId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Match ID is required']);
    exit;
}

// API configuration
$apiKey = '2d82524e5b7054f7d93825e696a35074';
$apiUrl = "https://v3.football.api-sports.io/fixtures?id=" . urlencode($matchId);

// Initialize cURL
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-apisports-key: ' . $apiKey,
    'x-apisports-host: v3.football.api-sports.io'
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

// Execute request
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

// Handle cURL errors
if ($error) {
    http_response_code(500);
    echo json_encode(['error' => 'API request failed: ' . $error]);
    exit;
}

// Handle HTTP errors
if ($httpCode !== 200) {
    http_response_code($httpCode);
    echo json_encode(['error' => 'API returned HTTP ' . $httpCode]);
    exit;
}

// Decode and validate response
$data = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(500);
    echo json_encode(['error' => 'Invalid JSON response from API']);
    exit;
}

// Return the response
echo json_encode($data);
?>
<?php
/**
 * Test script to manually run the fetch-matches cron job
 * This helps debug issues without waiting for cron jobs
 */

// Simulate command line environment
$_SERVER['HTTP_HOST'] = null;

// Set up arguments for testing
$argv = [
    'test-fetch.php',
    'today' // You can change this to 'live', 'today', or 'tomorrow'
];

echo "=== YALLAFOOT FETCH TEST ===\n";
echo "Testing fetch for: " . $argv[1] . "\n";
echo "Current time: " . date('Y-m-d H:i:s') . "\n";
echo "==============================\n\n";

// Include and run the fetch script
require_once 'fetch-matches.php';

echo "\n==============================\n";
echo "=== TEST COMPLETE ===\n";
echo "Check the logs/cron.log file for detailed output\n";
?>
<?php
/**
 * Log Viewer for YallaFoot API
 * Simple web interface to view cron logs
 */

// Include configuration
require_once 'config/api-config.php';

$logFile = __DIR__ . '/logs/cron.log';
$lines = isset($_GET['lines']) ? (int)$_GET['lines'] : 100;
$refresh = isset($_GET['refresh']) ? (int)$_GET['refresh'] : 0;

function getLogTail($file, $lines = 100) {
    if (!file_exists($file)) {
        return ["Log file not found: $file"];
    }
    
    $handle = fopen($file, "r");
    if (!$handle) {
        return ["Cannot read log file"];
    }
    
    $linecounter = $lines;
    $pos = -2;
    $beginning = false;
    $text = array();
    
    while ($linecounter > 0) {
        $t = " ";
        while ($t != "\n") {
            if (fseek($handle, $pos, SEEK_END) == -1) {
                $beginning = true;
                break;
            }
            $t = fgetc($handle);
            $pos--;
        }
        $linecounter--;
        if ($beginning) {
            rewind($handle);
        }
        $text[$lines - $linecounter - 1] = fgets($handle);
        if ($beginning) break;
    }
    fclose($handle);
    
    return array_reverse($text);
}

$logLines = getLogTail($logFile, $lines);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YallaFoot API - Log Viewer</title>
    <?php if ($refresh > 0): ?>
    <meta http-equiv="refresh" content="<?php echo $refresh; ?>">
    <?php endif; ?>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Courier New', monospace;
            background: #1a1a1a;
            color: #00ff00;
            padding: 20px;
            line-height: 1.4;
        }
        
        .header {
            background: #333;
            color: #fff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .header h1 {
            font-size: 1.5rem;
        }
        
        .controls {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .controls a {
            background: #4CAF50;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        
        .controls a:hover {
            background: #45a049;
        }
        
        .controls a.active {
            background: #2196F3;
        }
        
        .log-container {
            background: #0d1117;
            border: 1px solid #30363d;
            border-radius: 8px;
            padding: 20px;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .log-line {
            margin-bottom: 2px;
            padding: 2px 0;
            word-wrap: break-word;
        }
        
        .log-line:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        .timestamp {
            color: #58a6ff;
            font-weight: bold;
        }
        
        .error {
            background: rgba(255, 0, 0, 0.1);
            color: #ff6b6b;
        }
        
        .success {
            color: #51cf66;
        }
        
        .warning {
            color: #ffd43b;
        }
        
        .info {
            color: #74c0fc;
        }
        
        .separator {
            color: #fd7e14;
            font-weight: bold;
            border-top: 1px solid #30363d;
            padding-top: 5px;
            margin-top: 5px;
        }
        
        .stats {
            background: #333;
            color: #fff;
            padding: 10px 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 15px;
        }
        
        .stats div {
            font-size: 0.9rem;
        }
        
        .no-logs {
            text-align: center;
            color: #868e96;
            padding: 40px;
            font-size: 1.1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⚽ YallaFoot API - Cron Logs</h1>
        <div class="controls">
            <a href="?lines=50&refresh=<?php echo $refresh; ?>" <?php echo $lines == 50 ? 'class="active"' : ''; ?>>50 lines</a>
            <a href="?lines=100&refresh=<?php echo $refresh; ?>" <?php echo $lines == 100 ? 'class="active"' : ''; ?>>100 lines</a>
            <a href="?lines=200&refresh=<?php echo $refresh; ?>" <?php echo $lines == 200 ? 'class="active"' : ''; ?>>200 lines</a>
            <a href="?lines=<?php echo $lines; ?>&refresh=0" <?php echo $refresh == 0 ? 'class="active"' : ''; ?>>No Refresh</a>
            <a href="?lines=<?php echo $lines; ?>&refresh=5" <?php echo $refresh == 5 ? 'class="active"' : ''; ?>>5s Refresh</a>
            <a href="?lines=<?php echo $lines; ?>&refresh=10" <?php echo $refresh == 10 ? 'class="active"' : ''; ?>>10s Refresh</a>
            <a href="?lines=<?php echo $lines; ?>&refresh=30" <?php echo $refresh == 30 ? 'class="active"' : ''; ?>>30s Refresh</a>
        </div>
    </div>
    
    <div class="stats">
        <div><strong>Log File:</strong> <?php echo $logFile; ?></div>
        <div><strong>Lines:</strong> <?php echo count($logLines); ?></div>
        <div><strong>Last Modified:</strong> <?php echo file_exists($logFile) ? date('Y-m-d H:i:s', filemtime($logFile)) : 'N/A'; ?></div>
        <div><strong>File Size:</strong> <?php echo file_exists($logFile) ? round(filesize($logFile) / 1024, 2) . ' KB' : 'N/A'; ?></div>
        <?php if ($refresh > 0): ?>
        <div><strong>Auto-refresh:</strong> <?php echo $refresh; ?>s</div>
        <?php endif; ?>
    </div>
    
    <div class="log-container">
        <?php if (empty($logLines) || (count($logLines) == 1 && trim($logLines[0]) == '')): ?>
        <div class="no-logs">
            📋 No logs found<br>
            <small>Run the cron job or test script to generate logs</small>
        </div>
        <?php else: ?>
        <?php foreach ($logLines as $line): ?>
            <?php
            $line = htmlspecialchars($line);
            $cssClass = '';
            
            if (strpos($line, 'ERROR') !== false || strpos($line, 'FAILED') !== false) {
                $cssClass = 'error';
            } elseif (strpos($line, 'SUCCESS') !== false || strpos($line, 'saved successfully') !== false) {
                $cssClass = 'success';
            } elseif (strpos($line, 'WARNING') !== false || strpos($line, 'SKIP') !== false) {
                $cssClass = 'warning';
            } elseif (strpos($line, '===') !== false) {
                $cssClass = 'separator';
            } elseif (strpos($line, 'INFO') !== false) {
                $cssClass = 'info';
            }
            
            // Highlight timestamps
            $line = preg_replace('/\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/', '<span class="timestamp">[$1]</span>', $line);
            ?>
            <div class="log-line <?php echo $cssClass; ?>"><?php echo $line; ?></div>
        <?php endforeach; ?>
        <?php endif; ?>
    </div>
    
    <script>
        // Auto-scroll to bottom on page load
        document.addEventListener('DOMContentLoaded', function() {
            const container = document.querySelector('.log-container');
            container.scrollTop = container.scrollHeight;
        });
    </script>
</body>
</html>
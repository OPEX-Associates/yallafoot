<?php
require_once __DIR__ . '/config/api-config.php';
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/classes/Database.php';
require_once __DIR__ . '/classes/StreamManager.php';

$authUser = $_SERVER['PHP_AUTH_USER'] ?? null;
$authPass = $_SERVER['PHP_AUTH_PW'] ?? null;

if ($authUser !== ADMIN_USERNAME || $authPass !== ADMIN_PASSWORD) {
    header('WWW-Authenticate: Basic realm="YallaFoot Admin"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Unauthorized';
    exit;
}

$streamManager = new StreamManager();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $action = $_POST['action'] ?? '';
    $linkId = (int)($_POST['link_id'] ?? 0);
    $reason = trim((string)($_POST['reason'] ?? ''));

    if ($linkId > 0) {
        if ($action === 'approve') {
            $streamManager->approveLink($linkId, $authUser);
            header('Location: admin-links.php?notice=approved');
            exit;
        }

        if ($action === 'reject') {
            $streamManager->rejectLink($linkId, $reason !== '' ? $reason : null, $authUser);
            header('Location: admin-links.php?notice=rejected');
            exit;
        }
    }

    header('Location: admin-links.php?notice=invalid');
    exit;
}

$pendingLinks = $streamManager->getPendingLinksWithMatch(200, 0);
$approvedLinks = $streamManager->getApprovedLinks(50, 0);
$notice = $_GET['notice'] ?? '';

function h($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function formatMatchLabel($link) {
    $home = $link['home_team_name'] ?? '';
    $away = $link['away_team_name'] ?? '';
    $league = $link['league_name'] ?? '';
    $matchDate = $link['match_date'] ?? '';

    if ($home !== '' && $away !== '') {
        $label = $home . ' vs ' . $away;
        if ($league !== '') {
            $label .= ' (' . $league . ')';
        }
        if ($matchDate !== '') {
            $label .= ' - ' . $matchDate;
        }
        return $label;
    }

    return 'Match #' . ($link['match_id'] ?? 'N/A');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YallaFoot Admin - Stream Links</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #f7f7f9;
            margin: 0;
            padding: 24px;
            color: #1f2937;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            margin-bottom: 8px;
        }
        .notice {
            padding: 10px 14px;
            border-radius: 6px;
            background: #e0f2fe;
            color: #0369a1;
            margin: 16px 0;
            display: inline-block;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            margin-bottom: 24px;
        }
        th, td {
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
            font-size: 14px;
            vertical-align: top;
        }
        th {
            background: #111827;
            color: #fff;
            font-weight: 600;
        }
        .actions form {
            display: inline-block;
            margin-right: 8px;
        }
        .btn {
            border: none;
            padding: 6px 10px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        .btn-approve {
            background: #16a34a;
            color: #fff;
        }
        .btn-reject {
            background: #dc2626;
            color: #fff;
        }
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            background: #f3f4f6;
            font-size: 12px;
        }
        .url {
            word-break: break-all;
        }
        .muted {
            color: #6b7280;
            font-size: 12px;
        }
        .reject-input {
            width: 140px;
            padding: 4px 6px;
            border-radius: 4px;
            border: 1px solid #d1d5db;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Stream Link Approvals</h1>
        <p class="muted">Review user-submitted links and approve what should appear on the site.</p>

        <?php if ($notice !== ''): ?>
            <div class="notice">Action completed: <?php echo h($notice); ?></div>
        <?php endif; ?>

        <h2>Pending Submissions (<?php echo count($pendingLinks); ?>)</h2>
        <?php if (count($pendingLinks) === 0): ?>
            <p class="muted">No pending links right now.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Match</th>
                        <th>Stream</th>
                        <th>Quality</th>
                        <th>Language</th>
                        <th>Submitted By</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($pendingLinks as $link): ?>
                        <tr>
                            <td><?php echo h(formatMatchLabel($link)); ?></td>
                            <td class="url">
                                <div><strong><?php echo h($link['name']); ?></strong></div>
                                <div><a href="<?php echo h($link['url']); ?>" target="_blank" rel="noopener noreferrer"><?php echo h($link['url']); ?></a></div>
                                <div class="muted">Submitted: <?php echo h($link['created_at']); ?></div>
                            </td>
                            <td><span class="badge"><?php echo h($link['quality']); ?></span></td>
                            <td><?php echo h($link['language']); ?></td>
                            <td><?php echo h($link['submitted_by']); ?></td>
                            <td class="actions">
                                <form method="post">
                                    <input type="hidden" name="action" value="approve">
                                    <input type="hidden" name="link_id" value="<?php echo h($link['id']); ?>">
                                    <button class="btn btn-approve" type="submit">Approve</button>
                                </form>
                                <form method="post">
                                    <input type="hidden" name="action" value="reject">
                                    <input type="hidden" name="link_id" value="<?php echo h($link['id']); ?>">
                                    <input class="reject-input" type="text" name="reason" placeholder="Reason (optional)">
                                    <button class="btn btn-reject" type="submit">Reject</button>
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <h2>Recently Approved</h2>
        <?php if (count($approvedLinks) === 0): ?>
            <p class="muted">No approved links yet.</p>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>Stream</th>
                        <th>Match ID</th>
                        <th>Approved By</th>
                        <th>Approved At</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($approvedLinks as $link): ?>
                        <tr>
                            <td class="url">
                                <div><strong><?php echo h($link['name']); ?></strong></div>
                                <div><a href="<?php echo h($link['url']); ?>" target="_blank" rel="noopener noreferrer"><?php echo h($link['url']); ?></a></div>
                            </td>
                            <td><?php echo h($link['match_id']); ?></td>
                            <td><?php echo h($link['approved_by']); ?></td>
                            <td><?php echo h($link['approved_at']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</body>
</html>

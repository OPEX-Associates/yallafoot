<?php
/**
 * Stream Link Manager
 */
class StreamManager {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function submitLink($linkData) {
        $submittedIp = $this->cleanText($linkData['submitted_ip'] ?? '', 45);
        $submittedUserAgent = $this->cleanText($linkData['submitted_user_agent'] ?? '', 255);

        $data = [
            'match_id' => (int)($linkData['match_id'] ?? 0),
            'name' => $this->cleanText($linkData['name'] ?? '', 255),
            'url' => $this->cleanText($linkData['url'] ?? '', 1024),
            'quality' => $this->normalizeQuality($linkData['quality'] ?? 'HD'),
            'language' => $this->cleanText($linkData['language'] ?? 'English', 50),
            'submitted_by' => $this->cleanText($linkData['submitted_by'] ?? 'Anonymous', 100),
            'submitted_ip' => $submittedIp !== '' ? $submittedIp : null,
            'submitted_user_agent' => $submittedUserAgent !== '' ? $submittedUserAgent : null,
            'status' => 'pending',
            'is_working' => 1
        ];

        return $this->db->insertOrUpdate('stream_links', $data);
    }

    public function getApprovedLinksByMatchId($matchId) {
        $sql = "
            SELECT *
            FROM stream_links
            WHERE match_id = ? AND status = 'approved'
            ORDER BY approved_at DESC, created_at DESC
        ";

        return $this->db->fetchAll($sql, [(int)$matchId]);
    }

    public function getPendingLinks($limit = 100, $offset = 0) {
        $limit = (int)$limit;
        $offset = (int)$offset;

        $sql = "
            SELECT *
            FROM stream_links
            WHERE status = 'pending'
            ORDER BY created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        return $this->db->fetchAll($sql);
    }

    public function getPendingLinksWithMatch($limit = 100, $offset = 0) {
        $limit = (int)$limit;
        $offset = (int)$offset;

        $sql = "
            SELECT
                sl.*,
                m.match_date,
                ht.name AS home_team_name,
                at.name AS away_team_name,
                l.name AS league_name
            FROM stream_links sl
            LEFT JOIN matches m ON sl.match_id = m.id
            LEFT JOIN teams ht ON m.home_team_id = ht.id
            LEFT JOIN teams at ON m.away_team_id = at.id
            LEFT JOIN leagues l ON m.league_id = l.id
            WHERE sl.status = 'pending'
            ORDER BY sl.created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        return $this->db->fetchAll($sql);
    }

    public function getApprovedLinks($limit = 100, $offset = 0) {
        $limit = (int)$limit;
        $offset = (int)$offset;

        $sql = "
            SELECT *
            FROM stream_links
            WHERE status = 'approved'
            ORDER BY approved_at DESC, created_at DESC
            LIMIT {$limit} OFFSET {$offset}
        ";

        return $this->db->fetchAll($sql);
    }

    public function approveLink($linkId, $adminName = null) {
        $sql = "
            UPDATE stream_links
            SET status = 'approved',
                approved_by = ?,
                approved_at = NOW(),
                rejected_reason = NULL
            WHERE id = ?
        ";

        $this->db->query($sql, [$adminName, (int)$linkId]);
    }

    public function rejectLink($linkId, $reason = null, $adminName = null) {
        $sql = "
            UPDATE stream_links
            SET status = 'rejected',
                approved_by = ?,
                approved_at = NULL,
                rejected_reason = ?
            WHERE id = ?
        ";

        $this->db->query($sql, [$adminName, $reason, (int)$linkId]);
    }

    public function transformLinkForAPI($link) {
        return [
            'id' => (int)$link['id'],
            'matchId' => (int)$link['match_id'],
            'name' => $link['name'],
            'url' => $link['url'],
            'quality' => $link['quality'],
            'language' => $link['language'],
            'rating' => isset($link['rating']) ? (float)$link['rating'] : 0,
            'verified' => $link['status'] === 'approved',
            'isWorking' => isset($link['is_working']) ? (bool)$link['is_working'] : true,
            'submittedBy' => $link['submitted_by'] ?? 'Anonymous',
            'submittedAt' => $link['created_at'] ?? null
        ];
    }

    private function normalizeQuality($quality) {
        $quality = strtoupper(trim((string)$quality));
        $quality = str_replace(' ', '', $quality);

        switch ($quality) {
            case '4K':
                return '4K';
            case 'FULLHD':
            case 'FHD':
                return 'FHD';
            case 'SD':
                return 'SD';
            case 'HD':
            default:
                return 'HD';
        }
    }

    private function cleanText($value, $maxLength) {
        $value = trim((string)$value);
        if ($value === '') {
            return '';
        }

        $value = preg_replace('/\s+/', ' ', $value);
        return substr($value, 0, $maxLength);
    }
}
?>

<?php
/**
 * order-log.php — local, n8n-independent capture log for the order form.
 *
 * Two modes, dispatched on Content-Type:
 *   application/json      → upsert the order record (one file per browser session)
 *   multipart/form-data   → back up an uploaded document (only for records marked failed)
 *
 * Nothing here may ever break the order form: the client treats every call as
 * fire-and-forget, and this script always answers with JSON, never a PHP error page.
 */

@ini_set('display_errors', '0');
error_reporting(0);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

require_once __DIR__ . '/config.php';

// ── HELPERS ──────────────────────────────────────────────────────────────────

function reply($ok, $extra = []) {
    echo json_encode(array_merge(['ok' => (bool)$ok], $extra));
    exit;
}

function fail($code, $why) {
    http_response_code($code);
    reply(false, ['error' => $why]);
}

function nowIso() {
    return gmdate('c');
}

/** The only value ever used to build a path — anything else is rejected outright. */
function validLeadId($id) {
    return is_string($id) && preg_match('/^[a-f0-9]{32}$/', $id) === 1;
}

function monthDir($leadId) {
    $dir = rtrim(ORDER_LOG_DIR, '/') . '/' . gmdate('Y-m');
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    return $dir;
}

/** Locate an existing record for this lead id, searching the current then prior months. */
function findRecordPath($leadId) {
    $base = rtrim(ORDER_LOG_DIR, '/');
    foreach ([gmdate('Y-m'), gmdate('Y-m', strtotime('-1 month'))] as $m) {
        $p = $base . '/' . $m . '/' . $leadId . '.json';
        if (is_file($p)) return $p;
    }
    return monthDir($leadId) . '/' . $leadId . '.json';
}

function readRecord($path) {
    if (!is_file($path)) return null;
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') return null;
    $rec = json_decode($raw, true);
    return is_array($rec) ? $rec : null;
}

/** Atomic write — a reader never sees a half-written record. */
function writeRecord($path, $rec) {
    $tmp = $path . '.tmp';
    $ok  = @file_put_contents($tmp, json_encode($rec, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    if ($ok === false) return false;
    return @rename($tmp, $path);
}

function appendLedger($line) {
    $path = rtrim(ORDER_LOG_DIR, '/') . '/ledger.ndjson';
    $fh = @fopen($path, 'a');
    if (!$fh) return;
    if (flock($fh, LOCK_EX)) {
        fwrite($fh, json_encode($line, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n");
        fflush($fh);
        flock($fh, LOCK_UN);
    }
    fclose($fh);
}

/** Recursive array merge where incoming scalars/lists replace, nested maps merge. */
function mergeDeep($base, $incoming) {
    if (!is_array($base)) return $incoming;
    foreach ($incoming as $k => $v) {
        if (is_array($v) && isset($base[$k]) && is_array($base[$k]) && !isListArray($v)) {
            $base[$k] = mergeDeep($base[$k], $v);
        } else {
            $base[$k] = $v;
        }
    }
    return $base;
}

function isListArray($a) {
    if (!is_array($a)) return false;
    return $a === [] || array_keys($a) === range(0, count($a) - 1);
}

function clientIp() {
    return substr((string)($_SERVER['REMOTE_ADDR'] ?? ''), 0, 45);
}

/**
 * Delete document backups past their retention window. Runs on ~1 in 20 requests
 * so a normal page hit costs nothing. Only ever touches <lead_id> dirs inside ORDER_LOG_DIR.
 */
function maybeCleanup() {
    if (mt_rand(1, 20) !== 1) return;
    $base   = rtrim(ORDER_LOG_DIR, '/');
    $cutoff = time() - (ORDER_BACKUP_DAYS * 86400);
    foreach ((array)@glob($base . '/[0-9][0-9][0-9][0-9]-[0-9][0-9]', GLOB_ONLYDIR) as $month) {
        foreach ((array)@glob($month . '/*', GLOB_ONLYDIR) as $leadDir) {
            if (!validLeadId(basename($leadDir))) continue;   // never touch anything unexpected
            if (@filemtime($leadDir) > $cutoff) continue;
            foreach ((array)@glob($leadDir . '/*') as $f) {
                if (is_file($f)) @unlink($f);
            }
            @rmdir($leadDir);   // JSON record and ledger are deliberately kept
        }
    }
}

// ── FAILURE ALERT EMAIL ──────────────────────────────────────────────────────

function money($v) {
    return '$' . number_format((float)$v, 2);
}

function buildAlertBody($rec) {
    $c   = $rec['customer']   ?? [];
    $o   = $rec['order']      ?? [];
    $t   = $o['totals']       ?? [];
    $s   = $o['shipping']     ?? [];
    $p   = $o['payment']      ?? [];
    $sub = $rec['submission'] ?? [];
    $sig = $rec['signature']  ?? [];

    $L = [];
    $L[] = '*** THIS ORDER DID NOT REACH n8n — NO GMAIL THREAD WAS CREATED ***';
    $L[] = 'Contact the customer and re-enter the order manually.';
    $L[] = '';
    $L[] = 'WHY IT FAILED';
    $L[] = '  HTTP status : ' . (($sub['http_status'] ?? 0) ?: 'no response (network / unreachable)');
    $L[] = '  Error       : ' . ($sub['error'] ?? '—');
    $L[] = '  Attempted   : ' . ($sub['attempted_at'] ?? $rec['updated_at'] ?? '—');
    $L[] = '  Took        : ' . (isset($sub['duration_ms']) ? $sub['duration_ms'] . ' ms' : '—');
    $L[] = '';
    $L[] = 'CUSTOMER';
    $L[] = '  Name   : ' . trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
    $L[] = '  Email  : ' . ($c['email'] ?? '—');
    $L[] = '  Phone  : ' . trim(($c['phone_code'] ?? '') . ' ' . ($c['phone'] ?? ''));
    $L[] = '';
    $L[] = 'ORDER';
    $L[] = '  Plan        : ' . ($o['plan']['label'] ?? '—') . ' (' . money($o['plan']['price'] ?? 0) . ' per doc)';
    $L[] = '  Documents   : ' . ($o['doc_count'] ?? 0);
    $L[] = '  Destination : ' . ($o['destination_country'] ?? '—');

    foreach (($o['docs'] ?? []) as $d) {
        $addons = [];
        if (!empty($d['translate'])) $addons[] = 'translate to ' . ($d['translate_language'] ?: '?') . ' ' . money($d['translation_cost'] ?? 0);
        if (!empty($d['scan']))      $addons[] = 'scan ' . money($d['scan_cost'] ?? 0);
        $L[] = '    Doc ' . ($d['index'] ?? '?') . ': ' . ($d['filename'] ?: '(no file)')
             . ' — ' . ($d['pages'] ?? 0) . 'pg'
             . (isset($d['has_cover_page']) && $d['has_cover_page'] ? ', has cover page' : '')
             . ($addons ? ' — ' . implode(', ', $addons) : '');
    }

    $L[] = '';
    $L[] = 'TOTALS';
    $L[] = '  Plan subtotal   : ' . money($t['plan_subtotal']    ?? 0);
    $L[] = '  Add-ons         : ' . money($t['addons_subtotal']  ?? 0);
    $L[] = '  Shipping        : ' . money($t['shipping_cost']    ?? 0);
    $L[] = '  Base total      : ' . money($t['base_total']       ?? 0);
    if (!empty($t['paypal_fee'])) $L[] = '  PayPal fee (4%) : ' . money($t['paypal_fee']);
    $L[] = '  ORDER TOTAL     : ' . money($t['final_total']      ?? 0);
    $L[] = '';
    $L[] = 'PAYMENT';
    $L[] = '  Method : ' . ($p['method'] ?? '—');
    if (!empty($p['paypal_transaction_id'])) {
        $L[] = '  PayPal transaction : ' . $p['paypal_transaction_id'];
        $L[] = '  PayPal order id    : ' . ($p['paypal_order_id'] ?? '—');
        $L[] = '  PayPal payer       : ' . ($p['paypal_payer_name'] ?? '') . ' <' . ($p['paypal_payer_email'] ?? '') . '>';
        $L[] = '  >> MONEY MAY HAVE BEEN TAKEN — verify in PayPal before contacting.';
    }
    if (!empty($p['zelle_payer_email'])) {
        $L[] = '  Zelle payer email : ' . $p['zelle_payer_email'];
        $L[] = '  >> Check whether the Zelle transfer arrived before contacting.';
    }
    $L[] = '';
    $L[] = 'RETURN MAILING';
    $L[] = '  Option  : ' . ($s['return_mailing_label'] ?? $s['return_mailing'] ?? '—');
    if (empty($s['no_shipping'])) {
        $L[] = '  Name    : ' . ($s['return_name'] ?? '—');
        $L[] = '  Company : ' . ($s['return_company'] ?? '');
        $L[] = '  Address : ' . ($s['return_address'] ?? '');
        $L[] = '            ' . ($s['return_city'] ?? '') . ' ' . ($s['return_state'] ?? '') . ' ' . ($s['return_postal'] ?? '');
        $L[] = '            ' . ($s['return_country'] ?? '');
        $L[] = '  Phone   : ' . ($s['return_phone'] ?? '');
    }
    $L[] = '';
    $L[] = 'SIGNATURE';
    $L[] = '  Mode : ' . ($sig['mode'] ?? '—') . ($sig['signed_name'] ? ' — "' . $sig['signed_name'] . '"' : '');
    $L[] = '  Date : ' . ($sig['date'] ?? '—');
    $L[] = '';
    $L[] = 'DOCUMENTS ON THE SERVER';
    $L[] = '  Folder  : order_records/' . gmdate('Y-m') . '/' . $rec['lead_id'] . '/';
    $L[] = '  The customer\'s uploaded files are being copied there now (they upload in the';
    $L[] = '  background, so give it a minute). AUTO-DELETED AFTER ' . ORDER_BACKUP_DAYS . ' DAYS —';
    $L[] = '  download them before ' . gmdate('Y-m-d', time() + ORDER_BACKUP_DAYS * 86400) . '.';
    $L[] = '  If the folder is empty, the upload failed too — ask the customer to re-send.';
    $L[] = '';
    $L[] = 'Full record : order_records/' . gmdate('Y-m') . '/' . $rec['lead_id'] . '.json';
    $L[] = 'Lead id     : ' . $rec['lead_id'];

    return implode("\n", $L);
}

function sendFailureAlert(&$rec) {
    if (!empty($rec['alert_sent_at'])) return;   // de-dupe: refresh / retry must not spam

    $c    = $rec['customer'] ?? [];
    $name = trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
    $tot  = money($rec['order']['totals']['final_total'] ?? 0);
    $meth = $rec['order']['payment']['method'] ?? 'unknown';

    $subject = 'ORDER FAILED - ' . ($name ?: 'unknown customer') . ' - ' . $tot . ' - ' . $meth;
    $body    = buildAlertBody($rec);

    $headers  = 'From: US Authentication Alerts <' . ORDER_ALERT_FROM . ">\r\n";
    if (!empty($c['email']) && filter_var($c['email'], FILTER_VALIDATE_EMAIL)) {
        $headers .= 'Reply-To: ' . $c['email'] . "\r\n";   // reply goes straight to the customer
    }
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "X-Priority: 1\r\n";

    // Local testing: the PHP dev server has no mailer, so write the composed
    // message to disk instead. Never active for real visitors.
    $isLocal = in_array(clientIp(), ['127.0.0.1', '::1'], true);
    if (ORDER_LOG_DEBUG || $isLocal) {
        @file_put_contents(
            rtrim(ORDER_LOG_DIR, '/') . '/last_alert.txt',
            "To: " . ORDER_ALERT_EMAIL . "\nSubject: $subject\n$headers\n$body\n"
        );
    }

    // 5th arg sets the envelope sender (Return-Path) so SPF passes on the site's
    // own domain, independent of whatever ORDER_ALERT_FROM shows in the header.
    $envelope = defined('ORDER_ALERT_ENVELOPE') && ORDER_ALERT_ENVELOPE
        ? '-f' . ORDER_ALERT_ENVELOPE
        : '';
    $sent = @mail(ORDER_ALERT_EMAIL, $subject, $body, $headers, $envelope);

    // Locally there is no mailer, so writing last_alert.txt counts as delivery —
    // otherwise the de-dupe guard below could never be exercised in testing.
    if ($sent || $isLocal) {
        $rec['alert_sent_at'] = nowIso();
    }
    if (!$sent) {
        // Left un-timestamped in production so a later retry can still get through.
        $rec['alert_error'] = 'mail() returned false at ' . nowIso();
    }
}

// ── GUARDS ───────────────────────────────────────────────────────────────────

if (!defined('ORDER_LOG_ENABLED') || !ORDER_LOG_ENABLED) reply(true, ['disabled' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST')        fail(405, 'POST only');

if (!is_dir(ORDER_LOG_DIR)) @mkdir(ORDER_LOG_DIR, 0755, true);
if (!is_dir(ORDER_LOG_DIR) || !is_writable(ORDER_LOG_DIR)) fail(500, 'log dir not writable');

$contentType = strtolower($_SERVER['CONTENT_TYPE'] ?? '');

// ═════════════════════════════════════════════════════════════════════════════
//  FILE MODE — back up an uploaded document (failed orders only)
// ═════════════════════════════════════════════════════════════════════════════
if (strpos($contentType, 'multipart/form-data') !== false) {

    // post_max_size exceeded: PHP silently discards the body, leaving $_POST empty
    if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        fail(413, 'upload exceeded post_max_size');
    }

    $leadId = $_POST['lead_id'] ?? '';
    if (!validLeadId($leadId)) fail(400, 'bad lead_id');

    $recPath = findRecordPath($leadId);
    $rec     = readRecord($recPath);
    // Backups exist only for orders we already know failed — this stops the
    // endpoint from being usable as open file storage.
    if (!$rec || ($rec['status'] ?? '') !== 'failed') fail(403, 'no failed record for this lead');

    if (empty($_FILES['file']) || ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail(400, 'no file');
    }

    $tmpPath = $_FILES['file']['tmp_name'];
    $size    = (int)$_FILES['file']['size'];
    if ($size <= 0 || $size > 25 * 1024 * 1024) fail(413, 'file too large');

    // Never trust the client filename — derive the extension from the real MIME type.
    $allowed = [
        'application/pdf' => 'pdf',
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'application/msword' => 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
    ];
    $mime = '';
    if (function_exists('finfo_open')) {
        $fi = finfo_open(FILEINFO_MIME_TYPE);
        if ($fi) { $mime = (string)finfo_file($fi, $tmpPath); finfo_close($fi); }
    }
    if (!isset($allowed[$mime])) fail(415, 'file type not allowed: ' . ($mime ?: 'unknown'));
    $ext = $allowed[$mime];

    $idx = (int)($_POST['doc_index'] ?? 0);
    if ($idx < 1 || $idx > 10) fail(400, 'bad doc_index');

    $destDir = dirname($recPath) . '/' . $leadId;
    if (!is_dir($destDir) && !@mkdir($destDir, 0755, true)) fail(500, 'cannot create backup dir');

    $stored = 'doc_' . $idx . '.' . $ext;
    $dest   = $destDir . '/' . $stored;
    if (!@move_uploaded_file($tmpPath, $dest)) fail(500, 'cannot store file');
    @chmod($dest, 0644);

    $entry = [
        'doc_index'     => $idx,
        'stored_as'     => $stored,
        'original_name' => substr((string)($_FILES['file']['name'] ?? ''), 0, 255),
        'mime'          => $mime,
        'bytes'         => $size,
        'sha256'        => hash_file('sha256', $dest),
        'stored_at'     => nowIso(),
    ];

    $rec['backup'] = $rec['backup'] ?? [
        'dir'        => gmdate('Y-m') . '/' . $leadId . '/',
        'expires_at' => gmdate('c', time() + ORDER_BACKUP_DAYS * 86400),
        'files'      => [],
    ];
    // Replace any prior entry for this slot rather than duplicating it
    $rec['backup']['files'] = array_values(array_filter(
        $rec['backup']['files'] ?? [],
        function ($f) use ($idx) { return ($f['doc_index'] ?? null) !== $idx; }
    ));
    $rec['backup']['files'][] = $entry;
    $rec['updated_at'] = nowIso();

    writeRecord($recPath, $rec);
    appendLedger([
        'at' => nowIso(), 'lead_id' => $leadId, 'stage' => 'backup_stored',
        'status' => 'failed', 'file' => $stored, 'bytes' => $size,
    ]);

    reply(true, ['stored' => $stored]);
}

// ═════════════════════════════════════════════════════════════════════════════
//  JSON MODE — upsert the order record
// ═════════════════════════════════════════════════════════════════════════════
// Two accepted encodings. The browser sends application/x-www-form-urlencoded
// with the JSON in a 'payload' field, because shared-host mod_security rejects
// raw JSON bodies with a 406. Raw JSON is still accepted for curl and tests.
$raw = isset($_POST['payload'])
    ? (string)$_POST['payload']
    : file_get_contents('php://input');

if ($raw === false || strlen($raw) > 262144) fail(413, 'body too large');

$in = json_decode($raw, true);
if (!is_array($in)) fail(400, 'bad json');

$leadId = $in['lead_id'] ?? '';
if (!validLeadId($leadId)) fail(400, 'bad lead_id');

$stage  = substr((string)($in['stage']  ?? 'unknown'), 0, 40);
$status = (string)($in['status'] ?? 'draft');
if (!in_array($status, ['draft', 'pending', 'submitted', 'failed', 'abandoned'], true)) {
    $status = 'draft';
}
$data = is_array($in['data'] ?? null) ? $in['data'] : [];

$recPath = findRecordPath($leadId);
$rec     = readRecord($recPath);

if ($rec === null) {
    $rec = [
        'lead_id'    => $leadId,
        'created_at' => nowIso(),
        'meta'       => [
            'ip'         => clientIp(),
            'user_agent' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 300),
            'referrer'   => substr((string)($_SERVER['HTTP_REFERER'] ?? ''), 0, 300),
        ],
        'events'     => [],
    ];
}

$rec = mergeDeep($rec, $data);
$rec['lead_id']    = $leadId;              // never overridable from the payload
$rec['updated_at'] = nowIso();

// 'abandoned' must not overwrite a real outcome the customer already reached
if (!($status === 'abandoned' && in_array($rec['status'] ?? '', ['submitted', 'failed', 'pending'], true))) {
    $rec['status']         = $status;
    $rec['furthest_stage'] = $stage;
}

$rec['events'] = $rec['events'] ?? [];
$rec['events'][] = ['at' => nowIso(), 'stage' => $stage, 'status' => $status];
if (count($rec['events']) > 50) {
    $rec['events'] = array_slice($rec['events'], -50);   // bound a pathological session
}

if ($status === 'failed') {
    sendFailureAlert($rec);   // record is written immediately after, so a mail outage costs no data
}

writeRecord($recPath, $rec);

appendLedger([
    'at'          => nowIso(),
    'lead_id'     => $leadId,
    'stage'       => $stage,
    'status'      => $status,
    'email'       => $rec['customer']['email'] ?? '',
    'name'        => trim(($rec['customer']['first_name'] ?? '') . ' ' . ($rec['customer']['last_name'] ?? '')),
    'order_total' => $rec['order']['totals']['final_total'] ?? null,
    'http_status' => $rec['submission']['http_status'] ?? null,
    'error'       => $rec['submission']['error'] ?? null,
]);

maybeCleanup();

reply(true);

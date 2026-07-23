<?php
// config.example.php — TEMPLATE. Copy to the project root as config.php and fill
// in real values. config.php is gitignored and must never be committed.

define('PAYPAL_CLIENT_ID',        'your-paypal-client-id');

define('N8N_UPLOAD_FORM',         'https://your-n8n-host/webhook/upload_form');   // /webhook/ (production), not /webhook-test/
define('N8N_ADMIN_CANCEL_ORDER',  'https://your-n8n-host/webhook/cancel_order');
define('N8N_ADMIN_CONFIRM_PAY',   'https://your-n8n-host/webhook/confirm_payment');
define('N8N_ADMIN_FETCH_ORDERS',  'https://your-n8n-host/webhook/fetch_orders');

// ── ORDER CAPTURE LOG ─────────────────────────────────────────────
// Local, n8n-independent record of every order + alert on failed submissions.
define('ORDER_LOG_ENABLED',  true);                              // kill switch — false = form behaves exactly as before
define('ORDER_LOG_DIR',      __DIR__ . '/order_records');
define('ORDER_ALERT_EMAIL',  'you@example.com');                 // where failure alerts are sent
define('ORDER_ALERT_FROM',   'alerts@your-domain.com');          // visible From: — keep on your own domain for SPF/DMARC
define('ORDER_ALERT_ENVELOPE', 'alerts@your-domain.com');        // envelope sender (Return-Path) — always your own domain
define('ORDER_BACKUP_DAYS',  30);                                // document backups auto-delete after this many days
define('ORDER_LOG_DEBUG',    false);                             // true = also write composed alerts to last_alert.txt (testing only)

// FedEx API
define('FEDEX_CLIENT_ID',      'your-fedex-client-id');
define('FEDEX_CLIENT_SECRET',  'your-fedex-client-secret');
define('FEDEX_ACCOUNT_NUMBER', 'your-fedex-account-number');
define('FEDEX_ENV',            'sandbox'); // change to 'production' when ready

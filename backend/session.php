<?php
/**
 * Standalone admin session API (no shared config require).
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : '';
$password = 'OvitecAdmin2026';
$env = getenv('OVITEC_ADMIN_PASSWORD');
if (is_string($env) && $env !== '') {
  $password = $env;
}

function ovitec_out($data, int $status = 200): void {
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

if ($method === 'GET' && ($action === 'me' || $action === '')) {
  ovitec_out(['authenticated' => !empty($_SESSION['ovitec_admin'])]);
}

if ($method === 'POST' && $action === 'login') {
  $raw = file_get_contents('php://input');
  $body = json_decode(is_string($raw) ? $raw : '[]', true);
  if (!is_array($body)) {
    $body = [];
  }
  $given = '';
  if (isset($body['password'])) {
    $given = (string) $body['password'];
  } elseif (isset($_POST['password'])) {
    $given = (string) $_POST['password'];
  }
  if ($given === '' || !hash_equals($password, $given)) {
    ovitec_out([
      'error' => 'Invalid password',
      'debug_got_len' => strlen($given),
      'debug_raw_len' => is_string($raw) ? strlen($raw) : 0,
    ], 401);
  }
  $_SESSION['ovitec_admin'] = true;
  ovitec_out(['ok' => true, 'authenticated' => true]);
}

if ($method === 'POST' && $action === 'logout') {
  $_SESSION = [];
  if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
  }
  ovitec_out(['ok' => true, 'authenticated' => false]);
}

ovitec_out(['error' => 'Not found'], 404);

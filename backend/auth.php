<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : '';

try {
  if ($method === 'GET' && ($action === 'me' || $action === '')) {
    ovitec_json_response([
      'authenticated' => ovitec_is_admin(),
    ]);
  }

  if ($method === 'POST' && $action === 'login') {
    $body = ovitec_read_json_body();
    $password = isset($body['password']) ? (string) $body['password'] : '';
    if ($password === '' || !ovitec_verify_password($password)) {
      ovitec_json_response(['error' => 'Invalid password'], 401);
    }
    $_SESSION['ovitec_admin'] = true;
    ovitec_json_response(['ok' => true, 'authenticated' => true]);
  }

  if ($method === 'POST' && $action === 'logout') {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
      @session_destroy();
    }
    ovitec_json_response(['ok' => true, 'authenticated' => false]);
  }

  ovitec_json_response(['error' => 'Not found'], 404);
} catch (Throwable $e) {
  ovitec_fail($e);
}

<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = isset($_GET['action']) ? (string) $_GET['action'] : '';

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
    if (ini_get('session.use_cookies')) {
      $params = session_get_cookie_params();
      setcookie(session_name(), '', [
        'expires' => time() - 42000,
        'path' => $params['path'] ?? '/',
        'domain' => $params['domain'] ?? '',
        'secure' => !empty($params['secure']),
        'httponly' => !empty($params['httponly']),
        'samesite' => $params['samesite'] ?? 'Lax',
      ]);
    }
    try {
      @session_destroy();
    } catch (Throwable $e) {
      /* ignore */
    }
  }
  ovitec_json_response(['ok' => true, 'authenticated' => false]);
}

ovitec_json_response(['error' => 'Not found'], 404);

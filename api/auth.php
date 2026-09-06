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
      $name = session_name();
      $path = $params['path'] ?? '/';
      $domain = $params['domain'] ?? '';
      $secure = !empty($params['secure']);
      $httponly = !empty($params['httponly']);
      if (PHP_VERSION_ID >= 70300) {
        setcookie($name, '', [
          'expires' => time() - 42000,
          'path' => $path,
          'domain' => $domain,
          'secure' => $secure,
          'httponly' => $httponly,
          'samesite' => $params['samesite'] ?? 'Lax',
        ]);
      } else {
        setcookie($name, '', time() - 42000, $path, $domain, $secure, $httponly);
      }
    }
    try {
      @session_destroy();
    } catch (Throwable $e) {
      error_log('Ovitec session_destroy failed: ' . $e->getMessage());
    }
  }
  ovitec_json_response(['ok' => true, 'authenticated' => false]);
}

ovitec_json_response(['error' => 'Not found'], 404);

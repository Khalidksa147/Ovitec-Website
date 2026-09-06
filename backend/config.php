<?php
declare(strict_types=1);

const OVITEC_ROOT = dirname(__DIR__);
const UPLOAD_DIR = OVITEC_ROOT . '/uploads/products';
const UPLOAD_URL_PREFIX = '/uploads/products';

// Change this before going live. Optional override: OVITEC_ADMIN_PASSWORD env var.
const ADMIN_PASSWORD = 'OvitecAdmin2026';

function ovitec_is_https(): bool {
  if (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') {
    return true;
  }
  $forwarded = strtolower((string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? ''));
  return $forwarded === 'https'
    || (!empty($_SERVER['SERVER_PORT']) && (string) $_SERVER['SERVER_PORT'] === '443');
}

/**
 * Start PHP session without fatalling on Hostinger shared hosts.
 * Never writes to $_SESSION before session_start().
 */
function ovitec_bootstrap_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) {
    return;
  }
  if (session_status() === PHP_SESSION_DISABLED) {
    return;
  }

  $sessionDir = OVITEC_ROOT . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'sessions';
  if (!is_dir($sessionDir)) {
    @mkdir($sessionDir, 0755, true);
  }
  if (is_dir($sessionDir) && is_writable($sessionDir)) {
    @session_save_path($sessionDir);
  }

  $secure = ovitec_is_https();
  @session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
  ]);

  try {
    @session_start();
  } catch (Throwable $e) {
    error_log('Ovitec session_start failed: ' . $e->getMessage());
  }
}

function ovitec_json_response($data, int $status = 200): void {
  while (ob_get_level() > 0) {
    @ob_end_clean();
  }
  if (!headers_sent()) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
  }
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

set_exception_handler(static function (Throwable $e): void {
  error_log('Ovitec API exception: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
  ovitec_json_response(['error' => 'Server error'], 500);
});

ovitec_bootstrap_session();

function ovitec_products_file(): string {
  static $resolved = null;
  if ($resolved !== null) {
    return $resolved;
  }

  $env = getenv('OVITEC_DATA_DIR');
  if (is_string($env) && $env !== '') {
    $resolved = rtrim($env, '/\\') . DIRECTORY_SEPARATOR . 'products.json';
  } else {
    $resolved = OVITEC_ROOT . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'products.local.json';
  }

  ovitec_migrate_products_file($resolved);
  return $resolved;
}

function ovitec_migrate_products_file(string $target): void {
  if (is_file($target)) {
    return;
  }
  $sources = [
    OVITEC_ROOT . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'products.json',
    OVITEC_ROOT . DIRECTORY_SEPARATOR . 'data' . DIRECTORY_SEPARATOR . 'products.example.json',
  ];
  foreach ($sources as $source) {
    if ($source === $target || !is_file($source)) {
      continue;
    }
    $dir = dirname($target);
    if (!is_dir($dir)) {
      @mkdir($dir, 0755, true);
    }
    if (@copy($source, $target)) {
      return;
    }
  }
}

function ovitec_admin_password(): string {
  $env = getenv('OVITEC_ADMIN_PASSWORD');
  if (is_string($env) && $env !== '') {
    return $env;
  }
  return ADMIN_PASSWORD;
}

function ovitec_verify_password(string $password): bool {
  return hash_equals(ovitec_admin_password(), $password);
}

function ovitec_read_json_body(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || trim($raw) === '') {
    return [];
  }
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function ovitec_is_admin(): bool {
  return !empty($_SESSION['ovitec_admin']);
}

function ovitec_require_admin(): void {
  if (!ovitec_is_admin()) {
    ovitec_json_response(['error' => 'Unauthorized'], 401);
  }
}

function ovitec_vehicle_data(): array {
  static $data = null;
  if ($data === null) {
    $path = __DIR__ . '/vehicle-data.php';
    if (!is_file($path)) {
      ovitec_json_response(['error' => 'Vehicle data missing'], 500);
    }
    $loaded = require $path;
    if (!is_array($loaded)) {
      ovitec_json_response(['error' => 'Invalid vehicle data'], 500);
    }
    $data = $loaded;
  }
  return $data;
}

function ovitec_load_products(): array {
  $file = ovitec_products_file();
  if (!is_file($file)) {
    return [];
  }
  $raw = @file_get_contents($file);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function ovitec_save_products(array $products): void {
  $file = ovitec_products_file();
  $dir = dirname($file);
  if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
    ovitec_json_response(['error' => 'Failed to create data directory'], 500);
  }
  $json = json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    ovitec_json_response(['error' => 'Failed to encode products'], 500);
  }
  if (@file_put_contents($file, $json . "\n", LOCK_EX) === false) {
    ovitec_json_response(['error' => 'Failed to save products'], 500);
  }
}

function ovitec_uuid(): string {
  $bytes = random_bytes(16);
  $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
  $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
  $hex = bin2hex($bytes);
  return sprintf(
    '%s-%s-%s-%s-%s',
    substr($hex, 0, 8),
    substr($hex, 8, 4),
    substr($hex, 12, 4),
    substr($hex, 16, 4),
    substr($hex, 20, 12)
  );
}

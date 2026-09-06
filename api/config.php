<?php
declare(strict_types=1);

session_set_cookie_params([
  'lifetime' => 0,
  'path' => '/',
  'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
  'httponly' => true,
  'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
  session_start();
}

const OVITEC_ROOT = dirname(__DIR__);
const PRODUCTS_FILE = OVITEC_ROOT . '/data/products.json';
const UPLOAD_DIR = OVITEC_ROOT . '/uploads/products';
const UPLOAD_URL_PREFIX = '/uploads/products';

// Change this before going live. Optional override: OVITEC_ADMIN_PASSWORD env var.
const ADMIN_PASSWORD = 'OvitecAdmin2026';

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

function ovitec_json_response($data, int $status = 200): void {
  http_response_code($status);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
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
    $data = require __DIR__ . '/vehicle-data.php';
  }
  return $data;
}

function ovitec_load_products(): array {
  if (!is_file(PRODUCTS_FILE)) {
    return [];
  }
  $raw = file_get_contents(PRODUCTS_FILE);
  $data = json_decode($raw ?: '[]', true);
  return is_array($data) ? $data : [];
}

function ovitec_save_products(array $products): void {
  $dir = dirname(PRODUCTS_FILE);
  if (!is_dir($dir)) {
    mkdir($dir, 0755, true);
  }
  $json = json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    ovitec_json_response(['error' => 'Failed to encode products'], 500);
  }
  if (file_put_contents(PRODUCTS_FILE, $json . "\n", LOCK_EX) === false) {
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

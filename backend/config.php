<?php
const OVITEC_ROOT = dirname(__DIR__);
const UPLOAD_DIR = OVITEC_ROOT . '/uploads/products';
const UPLOAD_URL_PREFIX = '/uploads/products';
const ADMIN_PASSWORD = 'OvitecAdmin2026';

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

function ovitec_json_response($data, int $status = 200): void {
  if (!headers_sent()) {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
  }
  echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  exit;
}

function ovitec_products_file(): string {
  static $resolved = null;
  if ($resolved !== null) {
    return $resolved;
  }
  $env = getenv('OVITEC_DATA_DIR');
  $resolved = (is_string($env) && $env !== '')
    ? rtrim($env, "/\\") . '/products.json'
    : OVITEC_ROOT . '/data/products.local.json';

  if (!is_file($resolved)) {
    $example = OVITEC_ROOT . '/data/products.example.json';
    $legacy = OVITEC_ROOT . '/data/products.json';
    $dir = dirname($resolved);
    if (!is_dir($dir)) {
      @mkdir($dir, 0755, true);
    }
    if (is_file($legacy)) {
      @copy($legacy, $resolved);
    } elseif (is_file($example)) {
      @copy($example, $resolved);
    }
  }
  return $resolved;
}

function ovitec_admin_password(): string {
  $env = getenv('OVITEC_ADMIN_PASSWORD');
  return (is_string($env) && $env !== '') ? $env : ADMIN_PASSWORD;
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
      throw new RuntimeException('vehicle-data.php missing');
    }
    $loaded = require $path;
    if (!is_array($loaded)) {
      throw new RuntimeException('vehicle-data.php invalid');
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
    throw new RuntimeException('Cannot create data directory');
  }
  $json = json_encode(array_values($products), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
  if ($json === false) {
    throw new RuntimeException('Failed to encode products');
  }
  if (@file_put_contents($file, $json . "\n", LOCK_EX) === false) {
    throw new RuntimeException('Failed to write products file');
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

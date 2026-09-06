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

if (realpath((string) ($_SERVER['SCRIPT_FILENAME'] ?? '')) === realpath(__FILE__)) {
  header('Content-Type: application/json; charset=utf-8');
  echo json_encode(['ok' => true, 'half' => 'a']);
}

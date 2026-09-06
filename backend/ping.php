<?php
/**
 * Temporary diagnostics — delete after admin works.
 * Visit: /backend/ping.php
 */
header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

$out = [
  'ok' => true,
  'php' => PHP_VERSION,
  'sapi' => PHP_SAPI,
  'session_ext' => extension_loaded('session'),
  'dir' => __DIR__,
  'config_exists' => is_file(__DIR__ . '/config.php'),
  'auth_exists' => is_file(__DIR__ . '/auth.php'),
];

try {
  if (session_status() === PHP_SESSION_NONE) {
    session_start();
  }
  $out['session'] = 'ok';
  $out['authenticated'] = !empty($_SESSION['ovitec_admin']);
} catch (Throwable $e) {
  $out['session'] = 'fail';
  $out['session_error'] = $e->getMessage();
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

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
  'session_php_exists' => is_file(__DIR__ . '/session.php'),
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

try {
  require __DIR__ . '/config.php';
  $out['config_load'] = 'ok';
  $out['authenticated'] = ovitec_is_admin();
} catch (Throwable $e) {
  $out['config_load'] = 'fail';
  $out['config_error'] = $e->getMessage();
  $out['config_line'] = $e->getLine();
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

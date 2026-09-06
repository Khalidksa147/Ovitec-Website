<?php
/**
 * Temporary diagnostics — delete after admin works.
 * Visit: /backend/ping.php
 */
header('Content-Type: application/json; charset=utf-8');

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
} catch (Throwable $e) {
  $out['session'] = 'fail';
  $out['session_error'] = $e->getMessage();
}

echo json_encode($out, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

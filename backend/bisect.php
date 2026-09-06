<?php
header('Content-Type: application/json; charset=utf-8');
$step = isset($_GET['step']) ? (int) $_GET['step'] : 1;
$out = ['step' => $step];

try {
  if ($step >= 1) {
    $out['php'] = PHP_VERSION;
  }
  if ($step >= 2) {
    if (session_status() === PHP_SESSION_NONE) {
      session_start();
    }
    $out['session'] = session_id();
  }
  if ($step >= 3) {
    $root = dirname(__DIR__);
    $out['root'] = $root;
    $out['root_is_dir'] = is_dir($root);
  }
  if ($step >= 4) {
    $out['hash'] = hash_equals('a', 'a');
  }
  if ($step >= 5) {
    $path = dirname(__DIR__) . '/data/products.example.json';
    $out['example_exists'] = is_file($path);
  }
  if ($step >= 6) {
    // Mimic products file resolve without writing
    $resolved = dirname(__DIR__) . '/data/products.local.json';
    $out['local_exists'] = is_file($resolved);
  }
  if ($step >= 7) {
    define('ADMIN_PASSWORD', 'OvitecAdmin2026');
    $out['pwd_defined'] = defined('ADMIN_PASSWORD');
  }
  if ($step >= 8) {
    function ovitec_probe_fn(): bool {
      return true;
    }
    $out['fn'] = ovitec_probe_fn();
  }
  $out['ok'] = true;
  echo json_encode($out);
} catch (Throwable $e) {
  $out['ok'] = false;
  $out['detail'] = $e->getMessage();
  echo json_encode($out);
}

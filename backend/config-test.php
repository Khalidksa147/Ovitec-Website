<?php
header('Content-Type: application/json; charset=utf-8');
$steps = [];
$steps[] = 'start';
try {
  require __DIR__ . '/config.php';
  $steps[] = 'config_ok';
  $steps[] = ovitec_is_admin() ? 'admin_yes' : 'admin_no';
  echo json_encode(['ok' => true, 'steps' => $steps]);
} catch (Throwable $e) {
  echo json_encode([
    'ok' => false,
    'steps' => $steps,
    'detail' => $e->getMessage(),
    'line' => $e->getLine(),
  ]);
}

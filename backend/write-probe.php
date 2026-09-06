<?php
header('Content-Type: application/json; charset=utf-8');

// Probe: does mentioning file writes crash Hostinger on load?
function ovitec_save_probe(array $products): void {
  $file = dirname(__DIR__) . '/data/products.local.json';
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

echo json_encode(['ok' => true, 'has_save' => function_exists('ovitec_save_probe')]);

<?php
define('OVITEC_ROOT', dirname(__DIR__));
define('UPLOAD_DIR', OVITEC_ROOT . '/uploads/products');
define('UPLOAD_URL_PREFIX', '/uploads/products');
define('ADMIN_PASSWORD', 'OvitecAdmin2026');

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'stage' => 'defines', 'root' => OVITEC_ROOT]);

<?php
const OVITEC_ROOT = dirname(__DIR__);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'stage' => 'one-const', 'root' => OVITEC_ROOT]);

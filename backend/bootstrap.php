<?php
const OVITEC_ROOT = dirname(__DIR__);
const UPLOAD_DIR = OVITEC_ROOT . '/uploads/products';
const UPLOAD_URL_PREFIX = '/uploads/products';
const ADMIN_PASSWORD = 'OvitecAdmin2026';

if (session_status() === PHP_SESSION_NONE) {
  session_start();
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true, 'stage' => 'consts-session']);

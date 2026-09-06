<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
  ovitec_json_response(['error' => 'Method not allowed'], 405);
}

ovitec_require_admin();

if (!isset($_FILES['image']) || !is_array($_FILES['image'])) {
  ovitec_json_response(['error' => 'No image uploaded'], 422);
}

$file = $_FILES['image'];
if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  ovitec_json_response(['error' => 'Upload failed'], 422);
}

$maxBytes = 8 * 1024 * 1024;
if (($file['size'] ?? 0) <= 0 || $file['size'] > $maxBytes) {
  ovitec_json_response(['error' => 'Image must be between 1 byte and 8 MB'], 422);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$mime = $finfo->file($file['tmp_name']) ?: '';
$allowed = [
  'image/jpeg' => 'jpg',
  'image/png' => 'png',
  'image/webp' => 'webp',
  'image/gif' => 'gif',
];
if (!isset($allowed[$mime])) {
  ovitec_json_response(['error' => 'Only JPG, PNG, WEBP, or GIF images are allowed'], 422);
}

if (!is_dir(UPLOAD_DIR)) {
  mkdir(UPLOAD_DIR, 0755, true);
}

$filename = ovitec_uuid() . '.' . $allowed[$mime];
$dest = UPLOAD_DIR . DIRECTORY_SEPARATOR . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
  ovitec_json_response(['error' => 'Could not save uploaded file'], 500);
}

ovitec_json_response([
  'url' => UPLOAD_URL_PREFIX . '/' . $filename,
]);

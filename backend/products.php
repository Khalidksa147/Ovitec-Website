<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$vehicle = ovitec_vehicle_data();
$allowedBrands = array_keys($vehicle['models']);
$allowedCategories = $vehicle['categories'];

function ovitec_normalize_product(array $input, array $vehicle, ?array $existing = null): array {
  $allowedBrands = array_keys($vehicle['models']);
  $allowedCategories = $vehicle['categories'];

  $category = strtolower(trim((string) ($input['category'] ?? ($existing['category'] ?? ''))));
  $brand = strtolower(trim((string) ($input['brand'] ?? ($existing['brand'] ?? ''))));
  $model = trim((string) ($input['model'] ?? ($existing['model'] ?? '')));
  $title = trim((string) ($input['title'] ?? ($existing['title'] ?? '')));
  $description = trim((string) ($input['description'] ?? ($existing['description'] ?? '')));
  $image = trim((string) ($input['image'] ?? ($existing['image'] ?? '')));
  $priceRaw = $input['price'] ?? ($existing['price'] ?? null);
  $price = is_numeric($priceRaw) ? round((float) $priceRaw, 2) : null;

  if (!in_array($category, $allowedCategories, true)) {
    ovitec_json_response(['error' => 'Invalid category'], 422);
  }
  if (!in_array($brand, $allowedBrands, true)) {
    ovitec_json_response(['error' => 'Invalid brand'], 422);
  }
  $models = $vehicle['models'][$brand] ?? [];
  if ($model === '' || !in_array($model, $models, true)) {
    ovitec_json_response(['error' => 'Invalid model for brand'], 422);
  }
  if ($title === '') {
    ovitec_json_response(['error' => 'Title is required'], 422);
  }
  if ($description === '') {
    ovitec_json_response(['error' => 'Description is required'], 422);
  }
  if ($price === null || $price < 0) {
    ovitec_json_response(['error' => 'Valid price is required'], 422);
  }
  if ($image === '') {
    ovitec_json_response(['error' => 'Image is required'], 422);
  }

  return [
    'id' => $existing['id'] ?? ovitec_uuid(),
    'category' => $category,
    'title' => $title,
    'description' => $description,
    'price' => $price,
    'image' => $image,
    'brand' => $brand,
    'model' => $model,
    'updatedAt' => gmdate('c'),
  ];
}

if ($method === 'GET') {
  $products = ovitec_load_products();
  $category = isset($_GET['category']) ? strtolower(trim((string) $_GET['category'])) : '';
  $brand = isset($_GET['brand']) ? strtolower(trim((string) $_GET['brand'])) : '';
  $model = isset($_GET['model']) ? trim((string) $_GET['model']) : '';

  $filtered = array_values(array_filter($products, static function ($product) use ($category, $brand, $model) {
    if (!is_array($product)) {
      return false;
    }
    if ($category !== '' && ($product['category'] ?? '') !== $category) {
      return false;
    }
    if ($brand !== '' && ($product['brand'] ?? '') !== $brand) {
      return false;
    }
    if ($model !== '' && ($product['model'] ?? '') !== $model) {
      return false;
    }
    return true;
  }));

  ovitec_json_response(['products' => $filtered]);
}

if ($method === 'POST') {
  ovitec_require_admin();
  $body = ovitec_read_json_body();
  $product = ovitec_normalize_product($body, $vehicle);
  $products = ovitec_load_products();
  $products[] = $product;
  ovitec_save_products($products);
  ovitec_json_response(['product' => $product], 201);
}

if ($method === 'PUT') {
  ovitec_require_admin();
  $body = ovitec_read_json_body();
  $id = trim((string) ($body['id'] ?? ($_GET['id'] ?? '')));
  if ($id === '') {
    ovitec_json_response(['error' => 'Product id is required'], 422);
  }
  $products = ovitec_load_products();
  $index = null;
  foreach ($products as $i => $item) {
    if (($item['id'] ?? '') === $id) {
      $index = $i;
      break;
    }
  }
  if ($index === null) {
    ovitec_json_response(['error' => 'Product not found'], 404);
  }
  $product = ovitec_normalize_product($body, $vehicle, $products[$index]);
  $products[$index] = $product;
  ovitec_save_products($products);
  ovitec_json_response(['product' => $product]);
}

if ($method === 'DELETE') {
  ovitec_require_admin();
  $body = ovitec_read_json_body();
  $id = trim((string) ($body['id'] ?? ($_GET['id'] ?? '')));
  if ($id === '') {
    ovitec_json_response(['error' => 'Product id is required'], 422);
  }
  $products = ovitec_load_products();
  $before = count($products);
  $products = array_values(array_filter($products, static function ($item) use ($id) {
    return ($item['id'] ?? '') !== $id;
  }));
  if (count($products) === $before) {
    ovitec_json_response(['error' => 'Product not found'], 404);
  }
  ovitec_save_products($products);
  ovitec_json_response(['ok' => true]);
}

ovitec_json_response(['error' => 'Method not allowed'], 405);

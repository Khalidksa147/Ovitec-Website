/**
 * Local admin/dev server (Node) — mirrors Hostinger PHP APIs.
 * Usage: node server.js
 * Open: http://localhost:8080/admin
 * Password: OvitecAdmin2026 (same as backend/config.php)
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, "uploads", "products");
const ADMIN_PASSWORD = process.env.OVITEC_ADMIN_PASSWORD || "OvitecAdmin2026";

function resolveProductsFile() {
  const target = process.env.OVITEC_DATA_DIR
    ? path.join(process.env.OVITEC_DATA_DIR, "products.json")
    : path.join(ROOT, "data", "products.local.json");

  if (!fs.existsSync(target)) {
    const sources = [
      path.join(ROOT, "data", "products.json"),
      path.join(ROOT, "data", "products.example.json")
    ];
    fs.mkdirSync(path.dirname(target), { recursive: true });
    for (const source of sources) {
      if (fs.existsSync(source)) {
        fs.copyFileSync(source, target);
        return target;
      }
    }
    fs.writeFileSync(target, "[]\n", "utf8");
  }
  return target;
}

const PRODUCTS_FILE = resolveProductsFile();

const vehicleData = {
  models: {
    bentley: ["Bentayga", "Continental Flying Spur", "Continental GT", "Continental GTC", "Continental Supersports", "Mulsanne", "New Continental Convertible", "New Continental GT", "New Flying Spur"],
    "rolls-royce": ["Phantom", "Ghost", "Cullinan", "Wraith", "Dawn", "Spectre"],
    "aston-martin": ["Cygnet", "DB11", "DB7", "DB9", "DBS Superleggera", "DBS V12", "DBX", "One-77", "Rapide", "Rapide S", "V12 Vantage (2022+)", "V12 Zagato", "V8 Vantage (2019+)", "Vanquish", "Vantage", "Virage"],
    ferrari: ["12Cilindri", "12Cilindri Spider", "288 GTO", "296", "348", "355", "360", "430", "456", "458", "488", "512", "550-575", "599", "612", "812", "California", "California T", "Daytona", "Enzo", "F12", "F40", "F50", "F8", "FF", "GTC4Lusso", "LaFerrari", "Monza", "Portofino", "Portofino M", "Purosangue", "Roma", "SF90"],
    lamborghini: ["Aventador", "Diablo", "Gallardo", "Huracan", "Murcielago", "Revuelto", "Urus"],
    maserati: ["3200", "4200", "Ghibli", "GranCabrio", "GranTurismo", "Grecale", "Levante", "MC20", "Quattroporte"]
  },
  categories: ["aftermarket", "tuning"]
};

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".pdf": "application/pdf",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

const sessions = new Map();

function uuid() {
  return crypto.randomUUID();
}

function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (!k) return;
    out[k] = decodeURIComponent(rest.join("=") || "");
  });
  return out;
}

function sendJson(res, data, status = 200, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...extraHeaders
  });
  res.end(body);
}

function isAdmin(req) {
  const cookies = parseCookies(req.headers.cookie || "");
  const sid = cookies.ovitec_sid;
  return Boolean(sid && sessions.get(sid));
}

function requireAdmin(req, res) {
  if (!isAdmin(req)) {
    sendJson(res, { error: "Unauthorized" }, 401);
    return false;
  }
  return true;
}

function loadProducts() {
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveProducts(products) {
  fs.mkdirSync(path.dirname(PRODUCTS_FILE), { recursive: true });
  fs.writeFileSync(PRODUCTS_FILE, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function readJsonBody(req) {
  const buf = await readBody(req);
  if (!buf.length) return {};
  try {
    return JSON.parse(buf.toString("utf8"));
  } catch {
    return {};
  }
}

function normalizeProduct(input, existing = null) {
  const category = String(input.category ?? existing?.category ?? "").toLowerCase().trim();
  const brand = String(input.brand ?? existing?.brand ?? "").toLowerCase().trim();
  const model = String(input.model ?? existing?.model ?? "").trim();
  const title = String(input.title ?? existing?.title ?? "").trim();
  const description = String(input.description ?? existing?.description ?? "").trim();
  const image = String(input.image ?? existing?.image ?? "").trim();
  const price = Number(input.price ?? existing?.price);

  if (!vehicleData.categories.includes(category)) throw Object.assign(new Error("Invalid category"), { status: 422 });
  if (!vehicleData.models[brand]) throw Object.assign(new Error("Invalid brand"), { status: 422 });
  if (!model || !vehicleData.models[brand].includes(model)) throw Object.assign(new Error("Invalid model for brand"), { status: 422 });
  if (!title) throw Object.assign(new Error("Title is required"), { status: 422 });
  if (!description) throw Object.assign(new Error("Description is required"), { status: 422 });
  if (!Number.isFinite(price) || price < 0) throw Object.assign(new Error("Valid price is required"), { status: 422 });
  if (!image) throw Object.assign(new Error("Image is required"), { status: 422 });

  return {
    id: existing?.id || uuid(),
    category,
    title,
    description,
    price: Math.round(price * 100) / 100,
    image,
    brand,
    model,
    updatedAt: new Date().toISOString()
  };
}

function parseMultipart(buffer, boundary) {
  const parts = [];
  const delim = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(delim) + delim.length;
  while (start < buffer.length) {
    if (buffer[start] === 45 && buffer[start + 1] === 45) break; // --
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const next = buffer.indexOf(delim, start);
    if (next < 0) break;
    let part = buffer.subarray(start, next - 2); // trim \r\n
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd >= 0) {
      const headers = part.subarray(0, headerEnd).toString("utf8");
      const body = part.subarray(headerEnd + 4);
      const nameMatch = /name="([^"]+)"/.exec(headers);
      const fileMatch = /filename="([^"]*)"/.exec(headers);
      const typeMatch = /Content-Type:\s*([^\r\n]+)/i.exec(headers);
      parts.push({
        name: nameMatch?.[1] || "",
        filename: fileMatch?.[1] || "",
        type: typeMatch?.[1]?.trim() || "",
        body
      });
    }
    start = next + delim.length;
  }
  return parts;
}

async function handleUpload(req, res) {
  if (!requireAdmin(req, res)) return;
  const contentType = req.headers["content-type"] || "";
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) return sendJson(res, { error: "No image uploaded" }, 422);
  const boundary = match[1] || match[2];
  const buffer = await readBody(req);
  const parts = parseMultipart(buffer, boundary);
  const file = parts.find((p) => p.name === "image" && p.filename);
  if (!file) return sendJson(res, { error: "No image uploaded" }, 422);
  if (!file.body.length || file.body.length > 8 * 1024 * 1024) {
    return sendJson(res, { error: "Image must be between 1 byte and 8 MB" }, 422);
  }
  const allowed = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  let ext = allowed[file.type];
  if (!ext) {
    const lower = file.filename.toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) ext = "jpg";
    else if (lower.endsWith(".png")) ext = "png";
    else if (lower.endsWith(".webp")) ext = "webp";
    else if (lower.endsWith(".gif")) ext = "gif";
  }
  if (!ext) return sendJson(res, { error: "Only JPG, PNG, WEBP, or GIF images are allowed" }, 422);
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const filename = `${uuid()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.body);
  sendJson(res, { url: `/uploads/products/${filename}` });
}

async function handleAuth(req, res, url) {
  const action = url.searchParams.get("action") || "";
  if (req.method === "GET" && (action === "me" || action === "")) {
    return sendJson(res, { authenticated: isAdmin(req) });
  }
  if (req.method === "POST" && action === "login") {
    const body = await readJsonBody(req);
    if (String(body.password || "") !== ADMIN_PASSWORD) {
      return sendJson(res, { error: "Invalid password" }, 401);
    }
    const sid = uuid();
    sessions.set(sid, true);
    return sendJson(res, { ok: true, authenticated: true }, 200, {
      "Set-Cookie": `ovitec_sid=${encodeURIComponent(sid)}; Path=/; HttpOnly; SameSite=Lax`
    });
  }
  if (req.method === "POST" && action === "logout") {
    const cookies = parseCookies(req.headers.cookie || "");
    if (cookies.ovitec_sid) sessions.delete(cookies.ovitec_sid);
    return sendJson(res, { ok: true, authenticated: false }, 200, {
      "Set-Cookie": "ovitec_sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
    });
  }
  sendJson(res, { error: "Not found" }, 404);
}

async function handleProducts(req, res, url) {
  try {
    if (req.method === "GET") {
      const category = (url.searchParams.get("category") || "").toLowerCase().trim();
      const brand = (url.searchParams.get("brand") || "").toLowerCase().trim();
      const model = (url.searchParams.get("model") || "").trim();
      const products = loadProducts().filter((p) => {
        if (category && p.category !== category) return false;
        if (brand && p.brand !== brand) return false;
        if (model && p.model !== model) return false;
        return true;
      });
      return sendJson(res, { products });
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) return;
      const body = await readJsonBody(req);
      const product = normalizeProduct(body);
      const products = loadProducts();
      products.push(product);
      saveProducts(products);
      return sendJson(res, { product }, 201);
    }

    if (req.method === "PUT") {
      if (!requireAdmin(req, res)) return;
      const body = await readJsonBody(req);
      const id = String(body.id || url.searchParams.get("id") || "").trim();
      if (!id) return sendJson(res, { error: "Product id is required" }, 422);
      const products = loadProducts();
      const index = products.findIndex((p) => p.id === id);
      if (index < 0) return sendJson(res, { error: "Product not found" }, 404);
      const product = normalizeProduct(body, products[index]);
      products[index] = product;
      saveProducts(products);
      return sendJson(res, { product });
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      const body = await readJsonBody(req);
      const id = String(body.id || url.searchParams.get("id") || "").trim();
      if (!id) return sendJson(res, { error: "Product id is required" }, 422);
      const products = loadProducts();
      const next = products.filter((p) => p.id !== id);
      if (next.length === products.length) return sendJson(res, { error: "Product not found" }, 404);
      saveProducts(next);
      return sendJson(res, { ok: true });
    }

    sendJson(res, { error: "Method not allowed" }, 405);
  } catch (err) {
    sendJson(res, { error: err.message || "Request failed" }, err.status || 500);
  }
}

function resolveStatic(pathname) {
  let clean = decodeURIComponent(pathname.split("?")[0]);
  if (clean === "/") clean = "/index.html";

  // Arabic clean URLs
  if (clean === "/ar") return path.join(ROOT, "index-ar.html");
  const arMatch = /^\/ar\/(about|contact|bentley|rolls-royce|aston-martin|ferrari|lamborghini|maserati|aftermarket|products|404)\/?$/.exec(clean);
  if (arMatch) return path.join(ROOT, `${arMatch[1]}-ar.html`);

  let filePath = path.join(ROOT, clean);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }
  if (!fs.existsSync(filePath) && fs.existsSync(`${filePath}.html`)) {
    filePath = `${filePath}.html`;
  }
  return filePath;
}

function serveStatic(req, res, pathname) {
  const filePath = resolveStatic(pathname);
  if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": mime[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;

    if (pathname === "/backend/auth.php") return handleAuth(req, res, url);
    if (pathname === "/backend/products.php") return handleProducts(req, res, url);
    if (pathname === "/backend/upload.php") return handleUpload(req, res);

    // Don't execute PHP files; fall through to static 404 or source if present
    serveStatic(req, res, pathname);
  } catch (err) {
    sendJson(res, { error: err.message || "Server error" }, 500);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Ovitec local server running at http://localhost:${PORT}`);
  console.log(`Admin: http://localhost:${PORT}/admin`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
});

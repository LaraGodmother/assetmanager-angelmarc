/**
 * Production server for Expo web build + API proxy.
 *
 * - GET /api/* → proxied to API server on localhost:8080
 * - Static files from dist/ → served directly
 * - All other routes → dist/index.html (SPA routing)
 * - /manifest with expo-platform header → native manifest JSON (Expo Go)
 *
 * Zero external dependencies — uses only Node.js built-ins.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const WEB_ROOT = path.resolve(__dirname, "..", "dist");
const NATIVE_ROOT = path.resolve(__dirname, "..", "static-build");
const INDEX_HTML = path.join(WEB_ROOT, "index.html");
const API_PORT = parseInt(process.env.API_PORT || "8080", 10);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".map": "application/json",
};

function proxyToApi(req, res) {
  const options = {
    hostname: "localhost",
    port: API_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${API_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("API proxy error:", err.message);
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: "API unavailable", details: err.message }));
  });

  req.pipe(proxyReq, { end: true });
}

function serveFile(filePath, res) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "content-type": contentType });
  res.end(content);
  return true;
}

function serveManifest(platform, res) {
  const manifestPath = path.join(NATIVE_ROOT, platform, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: `Manifest not found for platform: ${platform}` }));
    return;
  }
  const manifest = fs.readFileSync(manifestPath, "utf-8");
  res.writeHead(200, {
    "content-type": "application/json",
    "expo-protocol-version": "1",
    "expo-sfv-version": "0",
  });
  res.end(manifest);
}

function serveIndex(res) {
  if (!fs.existsSync(INDEX_HTML)) {
    res.writeHead(503, { "content-type": "text/html; charset=utf-8" });
    res.end("<h1>App não iniciado</h1><p>Execute: pnpm --filter @workspace/mobile run build:web</p>");
    return;
  }
  const content = fs.readFileSync(INDEX_HTML);
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(content);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const pathname = url.pathname;

  // Proxy all /api/* requests to the API server
  if (pathname.startsWith("/api")) {
    return proxyToApi(req, res);
  }

  // Native manifest endpoint (Expo Go support)
  if (pathname === "/manifest") {
    const platform = req.headers["expo-platform"];
    if (platform === "ios" || platform === "android") {
      return serveManifest(platform, res);
    }
  }

  // Serve exact static file from dist/
  const safePath = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, "");
  const filePath = path.join(WEB_ROOT, safePath);

  if (filePath.startsWith(WEB_ROOT)) {
    const served = serveFile(filePath, res);
    if (served) return;
  }

  // SPA fallback — all unmatched routes get index.html
  serveIndex(res);
});

const port = parseInt(process.env.PORT || "18115", 10);
server.listen(port, "0.0.0.0", () => {
  console.log(`Serving Expo web build on port ${port}`);
  console.log(`API proxy → localhost:${API_PORT}`);
  console.log(`Web root: ${WEB_ROOT}`);
  console.log(`Index exists: ${fs.existsSync(INDEX_HTML)}`);
});

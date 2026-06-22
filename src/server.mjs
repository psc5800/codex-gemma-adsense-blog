import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { projectPath } from "./lib/config.mjs";
import { collectStatus } from "./status.mjs";
import { runApprovalAudit } from "./approval-audit.mjs";

const PORT = Number(process.env.PORT || 4871);
const HOST = process.env.HOST || "127.0.0.1";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, code, body, type = "application/json; charset=utf-8") {
  res.writeHead(code, { "content-type": type, "cache-control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 20000) reject(new Error("Request too large"));
    });
    req.on("end", () => resolve(body ? JSON.parse(body) : {}));
    req.on("error", reject);
  });
}

function runNodeScript(script, args = []) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [projectPath("src", script), ...args], {
      cwd: projectPath(),
      windowsHide: true,
      env: process.env
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

function serveFile(res, filePath) {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, "Not found", "text/plain; charset=utf-8");
    return;
  }
  const type = MIME[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, { "content-type": type });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === "/" || url.pathname === "/dashboard") {
      serveFile(res, projectPath("public", "dashboard.html"));
      return;
    }
    if (url.pathname.startsWith("/public/")) {
      serveFile(res, projectPath(url.pathname.slice(1)));
      return;
    }
    if (url.pathname.startsWith("/site/")) {
      const relative = url.pathname.replace(/^\/site\/?/, "");
      const requested = projectPath("site", relative || "index.html");
      serveFile(res, fs.existsSync(requested) && fs.statSync(requested).isDirectory() ? path.join(requested, "index.html") : requested);
      return;
    }
    if (url.pathname === "/api/status") {
      send(res, 200, JSON.stringify(await collectStatus()));
      return;
    }
    if (url.pathname === "/api/book-structure") {
      serveFile(res, projectPath("data", "book-structure.json"));
      return;
    }
    if (url.pathname === "/api/strategy") {
      serveFile(res, projectPath("data", "strategy.json"));
      return;
    }
    if (url.pathname === "/api/approval") {
      send(res, 200, JSON.stringify(runApprovalAudit()));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/build") {
      const result = await runNodeScript("build-site.mjs");
      send(res, result.code === 0 ? 200 : 500, JSON.stringify(result));
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/generate") {
      const body = await readBody(req);
      const args = ["--title", body.title || "", "--keyword", body.keyword || body.title || ""].filter(Boolean);
      const result = await runNodeScript("generate-post.mjs", args);
      send(res, result.code === 0 ? 200 : 500, JSON.stringify(result));
      return;
    }
    send(res, 404, JSON.stringify({ error: "Not found" }));
  } catch (error) {
    send(res, 500, JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Dashboard: http://${HOST}:${PORT}`);
  console.log(`Built site preview: http://${HOST}:${PORT}/site/`);
});

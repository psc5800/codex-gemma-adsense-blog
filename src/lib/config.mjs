import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const rows = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  const values = {};
  for (const row of rows) {
    const line = row.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

const fileEnv = parseEnvFile(path.join(ROOT, ".env"));

export function env(name, fallback = "") {
  return process.env[name] ?? fileEnv[name] ?? fallback;
}

export const config = {
  blogTitle: env("BLOG_TITLE", "Codex Gemma AdSense Blog"),
  blogDescription: env("BLOG_DESCRIPTION", "Low-cost static blog publishing with Gemma 4 and Codex OAuth."),
  blogUrl: env("BLOG_URL", "http://127.0.0.1:4871/site").replace(/\/$/, ""),
  authorName: env("AUTHOR_NAME", "Author"),
  language: env("LANGUAGE", "ko"),
  ollamaBaseUrl: env("OLLAMA_BASE_URL", "http://127.0.0.1:11435").replace(/\/$/, ""),
  ollamaModel: env("OLLAMA_MODEL", "gemma4:e2b"),
  adsenseEnabled: env("ADSENSE_ENABLED", "false").toLowerCase() === "true",
  adsenseClient: env("ADSENSE_CLIENT", ""),
  googleSiteVerification: env("GOOGLE_SITE_VERIFICATION", ""),
  naverSiteVerification: env("NAVER_SITE_VERIFICATION", "")
};

export function projectPath(...parts) {
  return path.join(ROOT, ...parts);
}

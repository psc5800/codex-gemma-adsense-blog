import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { config, projectPath } from "./lib/config.mjs";
import { getOllamaTags } from "./lib/ollama.mjs";

const execFileAsync = promisify(execFile);

function firstLine(text) {
  return text.trim().split(/\r?\n/).find(Boolean) || "";
}

function hermesSummary(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const model = lines.find((line) => line.startsWith("Model:"))?.replace(/\s+/g, " ");
  const provider = lines.find((line) => line.startsWith("Provider:"))?.replace(/\s+/g, " ");
  const codex = lines.find((line) => line.includes("OpenAI Codex") && line.includes("logged in"))?.replace(/\s+/g, " ");
  return [provider, model, codex].filter(Boolean).join(" · ") || firstLine(text);
}

async function commandVersion(command, args, pickText = firstLine) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 12000, windowsHide: true });
    return { ok: true, text: pickText(stdout || stderr) };
  } catch (error) {
    return { ok: false, text: error.message };
  }
}

function codexPathFromConfig() {
  const configPath = path.join(process.env.USERPROFILE || "", ".codex", "config.toml");
  if (!fs.existsSync(configPath)) return "codex";
  const match = fs.readFileSync(configPath, "utf8").match(/CODEX_CLI_PATH\s*=\s*'([^']+)'/);
  return match?.[1] && fs.existsSync(match[1]) ? match[1] : "codex";
}

export async function collectStatus() {
  const npmCheck = process.platform === "win32"
    ? commandVersion("cmd.exe", ["/c", "npm", "--version"])
    : commandVersion("npm", ["--version"]);
  const [node, npm, git, ollamaVersion, codexLogin, hermesStatus] = await Promise.all([
    commandVersion("node", ["--version"]),
    npmCheck,
    commandVersion("git", ["--version"]),
    commandVersion("ollama", ["--version"]),
    commandVersion(codexPathFromConfig(), ["login", "status"]),
    commandVersion("hermes", ["status"], hermesSummary)
  ]);

  let ollama = { ok: false, models: [], text: "not reachable" };
  try {
    const tags = await getOllamaTags(config.ollamaBaseUrl);
    ollama = {
      ok: true,
      models: (tags.models || []).map((model) => model.name),
      text: `${tags.models?.length || 0} model(s) at ${config.ollamaBaseUrl}`
    };
  } catch (error) {
    ollama.text = error.message;
  }

  return {
    generatedAt: new Date().toISOString(),
    root: projectPath(),
    config: {
      blogTitle: config.blogTitle,
      ollamaBaseUrl: config.ollamaBaseUrl,
      ollamaModel: config.ollamaModel,
      adsenseEnabled: config.adsenseEnabled
    },
    tools: {
      node,
      npm,
      git,
      ollamaVersion,
      ollama,
      codexLogin,
      hermesStatus
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(await collectStatus(), null, 2));
}

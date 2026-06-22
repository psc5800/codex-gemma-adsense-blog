import { config } from "./config.mjs";

export async function getOllamaTags(baseUrl = config.ollamaBaseUrl) {
  const response = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Ollama tags failed: ${response.status}`);
  return response.json();
}

export async function chatWithOllama(messages, options = {}) {
  const body = {
    model: options.model || config.ollamaModel,
    messages,
    stream: false,
    options: {
      temperature: options.temperature ?? 0.45,
      top_p: options.topP ?? 0.9
    }
  };
  const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options.timeoutMs ?? 180000)
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Ollama chat failed: ${response.status} ${text}`);
  }
  const json = await response.json();
  return json.message?.content?.trim() || "";
}

export async function generateArticle({ title, keyword }) {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = [
    "You are drafting a Korean static blog article for a GitHub Pages site.",
    "Write original content. Do not copy any source text.",
    "Avoid unsupported revenue claims. Avoid medical, legal, tax, and investment advice unless the article is only general education.",
    "Return only Markdown with YAML frontmatter.",
    "Frontmatter fields: title, date, description, tags.",
    "Article requirements: one H1, 4-6 H2 sections, one small table, practical checklist, balanced caveats.",
    `Date: ${today}`,
    `Title: ${title}`,
    `Primary keyword: ${keyword}`
  ].join("\n");

  return chatWithOllama([
    {
      role: "system",
      content: "You produce concise, useful Korean editorial drafts that are safe for AdSense review and easy for humans to edit."
    },
    { role: "user", content: prompt }
  ]);
}

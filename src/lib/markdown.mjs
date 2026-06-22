import fs from "node:fs";
import path from "node:path";

export function slugify(input) {
  const normalized = input
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return normalized || `post-${Date.now()}`;
}

export function parseFrontmatter(source) {
  if (!source.startsWith("---")) {
    return { data: {}, body: source.trim() };
  }
  const end = source.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: source.trim() };
  const raw = source.slice(3, end).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean);
    } else if (key === "tags" && value.includes(",")) {
      value = value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    data[key] = value;
  }
  return { data, body: source.slice(end + 4).trim() };
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineMarkdown(text) {
  return escapeHtml(text)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" rel="noopener">$1</a>');
}

export function markdownToHtml(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const html = [];
  let paragraph = [];
  let listOpen = false;
  let table = [];

  function flushParagraph() {
    if (paragraph.length) {
      html.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
      paragraph = [];
    }
  }

  function flushList() {
    if (listOpen) {
      html.push("</ul>");
      listOpen = false;
    }
  }

  function flushTable() {
    if (!table.length) return;
    const [header, separator, ...rows] = table;
    if (!separator || !/^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(separator)) {
      paragraph.push(...table);
      table = [];
      return;
    }
    const cells = (row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
    html.push("<table><thead><tr>");
    for (const cell of cells(header)) html.push(`<th>${inlineMarkdown(cell)}</th>`);
    html.push("</tr></thead><tbody>");
    for (const row of rows) {
      html.push("<tr>");
      for (const cell of cells(row)) html.push(`<td>${inlineMarkdown(cell)}</td>`);
      html.push("</tr>");
    }
    html.push("</tbody></table>");
    table = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      flushTable();
      flushParagraph();
      flushList();
      continue;
    }
    if (line.includes("|") && !line.startsWith("#") && !line.startsWith("- ")) {
      flushParagraph();
      flushList();
      table.push(line);
      continue;
    }
    flushTable();
    const heading = /^(#{1,4})\s+(.+)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (!listOpen) {
        html.push("<ul>");
        listOpen = true;
      }
      html.push(`<li>${inlineMarkdown(bullet[1])}</li>`);
      continue;
    }
    paragraph.push(line.trim());
  }
  flushTable();
  flushParagraph();
  flushList();
  return html.join("\n");
}

export function readMarkdownCollection(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith(".md"))
    .sort()
    .map((file) => {
      const fullPath = path.join(directory, file);
      const source = fs.readFileSync(fullPath, "utf8");
      const parsed = parseFrontmatter(source);
      const slug = parsed.data.slug || path.basename(file, ".md");
      return {
        file,
        fullPath,
        slug,
        ...parsed,
        urlPath: slug === "index" ? "/" : `/${slug}/`
      };
    });
}

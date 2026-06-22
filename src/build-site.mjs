import fs from "node:fs";
import path from "node:path";
import { config, projectPath } from "./lib/config.mjs";
import { escapeHtml, markdownToHtml, readMarkdownCollection } from "./lib/markdown.mjs";

const siteDir = projectPath("site");
const publicDir = projectPath("public");

function cleanDir(directory) {
  fs.rmSync(directory, { recursive: true, force: true });
  fs.mkdirSync(directory, { recursive: true });
}

function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

function pageShell({ title, description, body, canonical }) {
  const metaVerification = [
    config.googleSiteVerification ? `<meta name="google-site-verification" content="${escapeHtml(config.googleSiteVerification)}">` : "",
    config.naverSiteVerification ? `<meta name="naver-site-verification" content="${escapeHtml(config.naverSiteVerification)}">` : ""
  ].filter(Boolean).join("\n    ");
  const adScript = config.adsenseEnabled && config.adsenseClient
    ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${escapeHtml(config.adsenseClient)}" crossorigin="anonymous"></script>`
    : "";
  return `<!doctype html>
<html lang="${escapeHtml(config.language)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} | ${escapeHtml(config.blogTitle)}</title>
  <meta name="description" content="${escapeHtml(description || config.blogDescription)}">
  <link rel="icon" href="data:,">
  <link rel="canonical" href="${escapeHtml(canonical)}">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(config.blogTitle)} RSS" href="${escapeHtml(config.blogUrl)}/rss.xml">
  ${metaVerification}
  ${adScript}
  <link rel="stylesheet" href="${escapeHtml(config.blogUrl)}/assets/site.css">
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${escapeHtml(config.blogUrl)}/">${escapeHtml(config.blogTitle)}</a>
    <nav>
      <a href="${escapeHtml(config.blogUrl)}/about/">소개</a>
      <a href="${escapeHtml(config.blogUrl)}/privacy/">개인정보처리방침</a>
      <a href="${escapeHtml(config.blogUrl)}/contact/">문의</a>
    </nav>
  </header>
  <main class="container">
    ${body}
  </main>
  <footer class="site-footer">
    <span>&copy; ${new Date().getFullYear()} ${escapeHtml(config.authorName)}</span>
    <a href="${escapeHtml(config.blogUrl)}/sitemap.xml">Sitemap</a>
  </footer>
</body>
</html>`;
}

function renderArticle(item, type) {
  const title = item.data.title || item.slug;
  const description = item.data.description || config.blogDescription;
  const canonical = `${config.blogUrl}${item.urlPath}`;
  const date = item.data.date ? `<p class="meta">${escapeHtml(item.data.date)} · ${escapeHtml(type)}</p>` : "";
  const tags = Array.isArray(item.data.tags) && item.data.tags.length
    ? `<div class="tags">${item.data.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>`
    : "";
  const body = `<article class="article">
    ${date}
    ${markdownToHtml(item.body)}
    ${tags}
  </article>`;
  return pageShell({ title, description, canonical, body });
}

function renderIndex(posts) {
  const list = posts.map((post) => {
    const title = post.data.title || post.slug;
    const description = post.data.description || "";
    return `<article class="post-card">
      <a href="${escapeHtml(config.blogUrl)}${post.urlPath}">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
        <span>${escapeHtml(post.data.date || "")}</span>
      </a>
    </article>`;
  }).join("\n");
  const body = `<section class="intro">
    <p class="kicker">GitHub Pages static blog</p>
    <h1>${escapeHtml(config.blogTitle)}</h1>
    <p>${escapeHtml(config.blogDescription)}</p>
  </section>
  <section class="post-list">${list || "<p>아직 발행된 글이 없습니다.</p>"}</section>`;
  return pageShell({
    title: "Home",
    description: config.blogDescription,
    canonical: `${config.blogUrl}/`,
    body
  });
}

function renderRss(posts) {
  const items = posts.slice(0, 20).map((post) => {
    const title = post.data.title || post.slug;
    const link = `${config.blogUrl}${post.urlPath}`;
    return `<item>
  <title>${escapeHtml(title)}</title>
  <link>${escapeHtml(link)}</link>
  <guid>${escapeHtml(link)}</guid>
  <description>${escapeHtml(post.data.description || "")}</description>
  <pubDate>${new Date(post.data.date || Date.now()).toUTCString()}</pubDate>
</item>`;
  }).join("\n");
  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
  <title>${escapeHtml(config.blogTitle)}</title>
  <link>${escapeHtml(config.blogUrl)}</link>
  <description>${escapeHtml(config.blogDescription)}</description>
  ${items}
</channel>
</rss>`;
}

function renderSitemap(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((entry) => `  <url><loc>${escapeHtml(config.blogUrl + entry)}</loc></url>`).join("\n")}
</urlset>`;
}

cleanDir(siteDir);
fs.mkdirSync(path.join(siteDir, "assets"), { recursive: true });
fs.copyFileSync(path.join(publicDir, "site.css"), path.join(siteDir, "assets", "site.css"));

const posts = readMarkdownCollection(projectPath("content", "posts"))
  .filter((post) => post.data.draft !== "true")
  .sort((a, b) => String(b.data.date || "").localeCompare(String(a.data.date || "")));
const pages = readMarkdownCollection(projectPath("content", "pages"));

write(path.join(siteDir, "index.html"), renderIndex(posts));

for (const post of posts) {
  write(path.join(siteDir, post.slug, "index.html"), renderArticle(post, "post"));
}
for (const page of pages) {
  write(path.join(siteDir, page.slug, "index.html"), renderArticle(page, "page"));
}

const entries = ["/", ...posts.map((post) => post.urlPath), ...pages.map((page) => page.urlPath)];
write(path.join(siteDir, "rss.xml"), renderRss(posts));
write(path.join(siteDir, "sitemap.xml"), renderSitemap(entries));
write(path.join(siteDir, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${config.blogUrl}/sitemap.xml\n`);

console.log(`Built ${posts.length} post(s), ${pages.length} page(s) into ${siteDir}`);

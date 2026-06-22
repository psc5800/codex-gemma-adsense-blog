import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config, projectPath } from "./lib/config.mjs";
import { readMarkdownCollection } from "./lib/markdown.mjs";

function wordishCount(text) {
  return text.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
}

function status(ok, label, detail, severity = "warn") {
  return { ok, label, detail, severity };
}

export function runApprovalAudit() {
  const posts = readMarkdownCollection(projectPath("content", "posts")).filter((post) => post.data.draft !== "true");
  const pages = readMarkdownCollection(projectPath("content", "pages"));
  const pageSlugs = new Set(pages.map((page) => page.slug));
  const titles = posts.map((post) => String(post.data.title || post.slug).trim().toLowerCase());
  const duplicateTitles = titles.filter((title, index) => titles.indexOf(title) !== index);
  const shortPosts = posts.filter((post) => wordishCount(post.body) < 500);
  const missingDescriptions = posts.filter((post) => !post.data.description);
  const generatedSiteExists = fs.existsSync(projectPath("site", "index.html"));
  const requiredPages = ["about", "privacy", "contact"];

  const checks = [
    status(posts.length >= 10, "발행 글 10개 이상", `${posts.length}개 감지됨`, "warn"),
    status(requiredPages.every((slug) => pageSlugs.has(slug)), "필수 페이지", requiredPages.filter((slug) => !pageSlugs.has(slug)).join(", ") || "모두 있음", "fail"),
    status(shortPosts.length === 0, "짧은 본문 없음", shortPosts.map((post) => post.file).join(", ") || "통과", "warn"),
    status(missingDescriptions.length === 0, "메타 설명", missingDescriptions.map((post) => post.file).join(", ") || "통과", "warn"),
    status(duplicateTitles.length === 0, "중복 제목", duplicateTitles.join(", ") || "통과", "fail"),
    status(!config.adsenseEnabled || Boolean(config.adsenseClient), "AdSense client 설정", config.adsenseEnabled ? "광고 활성 상태" : "승인 전 광고 비활성", "fail"),
    status(generatedSiteExists, "정적 사이트 빌드", generatedSiteExists ? "site/index.html 있음" : "npm run build 필요", "warn")
  ];

  return {
    generatedAt: new Date().toISOString(),
    counts: { posts: posts.length, pages: pages.length },
    ready: checks.every((check) => check.ok || check.severity !== "fail"),
    checks
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = runApprovalAudit();
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ready ? 0 : 1);
}

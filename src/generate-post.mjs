import fs from "node:fs";
import path from "node:path";
import { generateArticle } from "./lib/ollama.mjs";
import { projectPath } from "./lib/config.mjs";
import { parseFrontmatter, slugify } from "./lib/markdown.mjs";

function readArg(name, fallback = "") {
  const index = process.argv.indexOf(name);
  if (index !== -1 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const title = readArg("--title", "깃허브 페이지 블로그를 오래 운영하는 현실적인 루틴");
const keyword = readArg("--keyword", title);
const publish = process.argv.includes("--publish");

function normalizeMarkdown(source) {
  let normalized = source.trim();
  const fence = normalized.match(/^```(?:markdown|md)?\s*([\s\S]*?)\s*```$/i);
  if (fence) normalized = fence[1].trim();
  if (!normalized.startsWith("---")) return normalized;
  const end = normalized.indexOf("\n---", 3);
  if (end === -1) return normalized;
  const frontmatter = normalized.slice(3, end).trim();
  const body = normalized.slice(end + 4).trim();
  if (publish || /^draft\s*:/m.test(frontmatter)) return normalized;
  return `---\n${frontmatter}\ndraft: "true"\n---\n\n${body}`;
}

let markdown = "";
try {
  markdown = await generateArticle({ title, keyword });
} catch (error) {
  const today = new Date().toISOString().slice(0, 10);
  markdown = `---
title: "${title}"
date: "${today}"
description: "Gemma 4 연결 전에도 편집 가능한 초안 템플릿입니다."
tags: ["draft", "workflow"]
draft: "true"
---

# ${title}

## 작성 목적

이 글은 로컬 Gemma 4 연결이 준비되기 전에 생성된 편집용 초안입니다. 핵심 키워드는 ${keyword}입니다.

## 확인할 관점

- 독자가 실제로 겪는 문제를 먼저 정의합니다.
- 과장된 수익 표현을 피합니다.
- 표와 체크리스트를 넣어 읽는 시간을 늘립니다.
- 발행 전 사실 확인과 중복 검사를 진행합니다.

## 초안 표

| 항목 | 확인 내용 |
| --- | --- |
| 검색 의도 | 독자가 해결하려는 문제 |
| 차별점 | 직접 경험 또는 검증 가능한 비교 |
| 정책 안전 | 광고 클릭 유도와 과장 표현 배제 |

## 발행 전 체크리스트

- 제목과 본문 키워드가 자연스럽게 연결된다.
- 개인정보처리방침, 소개, 문의 페이지가 연결되어 있다.
- 같은 주제의 기존 글과 제목이 겹치지 않는다.
`;
  console.warn(`Ollama unavailable, wrote fallback draft: ${error.message}`);
}

markdown = normalizeMarkdown(markdown);
const parsed = parseFrontmatter(markdown);
const finalTitle = parsed.data.title || title;
const date = parsed.data.date || new Date().toISOString().slice(0, 10);
const slug = slugify(`${date}-${finalTitle}`);
const outFile = projectPath("content", "posts", `${slug}.md`);

if (fs.existsSync(outFile)) {
  throw new Error(`Refusing to overwrite existing post: ${outFile}`);
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, markdown.trim() + "\n", "utf8");
console.log(outFile);

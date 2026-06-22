const $ = (selector) => document.querySelector(selector);
const statusGrid = $("#statusGrid");
const logOutput = $("#logOutput");

function log(value) {
  logOutput.textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...options
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function toolCard(name, result) {
  const ok = Boolean(result?.ok);
  const cls = ok ? "ok" : "warn";
  return `<article class="status-card ${cls}">
    <strong>${name}: ${ok ? "OK" : "확인 필요"}</strong>
    <p>${result?.text || "상태 없음"}</p>
  </article>`;
}

async function loadStatus() {
  statusGrid.innerHTML = "<p>확인 중...</p>";
  const status = await api("/api/status");
  const tools = status.tools || {};
  statusGrid.innerHTML = [
    toolCard("Node", tools.node),
    toolCard("npm", tools.npm),
    toolCard("Git", tools.git),
    toolCard("Ollama", tools.ollamaVersion),
    toolCard("Gemma 서버", tools.ollama),
    toolCard("Codex OAuth", tools.codexLogin),
    toolCard("Hermes", tools.hermesStatus)
  ].join("");
  log(status);
}

async function loadStrategy() {
  const strategy = await api("/api/strategy");
  $("#strategyList").innerHTML = strategy.defaultRoute.map((item) => `<article class="route-item">
    <span>${item.tool}</span>
    <h2>${item.work}</h2>
    <p>${item.reason}</p>
  </article>`).join("");
}

const approvalItems = [
  "소개, 개인정보처리방침, 문의 페이지의 실제 연락 정보 확인",
  "승인 전 ADSENSE_ENABLED=false 유지",
  "10개 이상의 직접 검수한 글 확보",
  "중복 제목과 짧은 본문 수정",
  "Google Search Console과 Naver Search Advisor 등록",
  "광고 클릭 유도 문구 제거",
  "수익 보장처럼 보이는 제목 제거",
  "모바일 화면에서 글과 메뉴가 겹치지 않는지 확인"
];

function loadChecklist() {
  const saved = JSON.parse(localStorage.getItem("approvalChecklist") || "{}");
  $("#approvalChecklist").innerHTML = approvalItems.map((item, index) => `<label>
    <input type="checkbox" data-index="${index}" ${saved[index] ? "checked" : ""}>
    <span>${item}</span>
  </label>`).join("");
  $("#approvalChecklist").addEventListener("change", (event) => {
    if (event.target.matches("input[type='checkbox']")) {
      const next = JSON.parse(localStorage.getItem("approvalChecklist") || "{}");
      next[event.target.dataset.index] = event.target.checked;
      localStorage.setItem("approvalChecklist", JSON.stringify(next));
    }
  });
}

async function runAudit() {
  const report = await api("/api/approval");
  $("#auditSummary").innerHTML = `<strong>${report.ready ? "필수 차단 항목 없음" : "차단 항목 확인 필요"}</strong>
    <p>글 ${report.counts.posts}개, 페이지 ${report.counts.pages}개</p>
    <ul>${report.checks.map((check) => `<li>${check.ok ? "통과" : "점검"} · ${check.label}: ${check.detail}</li>`).join("")}</ul>`;
  log(report);
}

async function loadBook() {
  const book = await api("/api/book-structure");
  $("#bookTree").innerHTML = book.items.map((item) => `<li class="depth-${item.depth}">
    <a href="${item.url}" target="_blank" rel="noopener">${String(item.order).padStart(2, "0")}. ${item.title}</a>
    <small>${item.localMapping}</small>
  </li>`).join("");
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    $(`#${tab.dataset.target}`).classList.add("active");
  });
});

$("#refreshStatus").addEventListener("click", loadStatus);
$("#buildSite").addEventListener("click", async () => {
  log("빌드 실행 중...");
  log(await api("/api/build", { method: "POST", body: "{}" }));
  await runAudit();
});
$("#runAudit").addEventListener("click", runAudit);
$("#generateForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  log("초안 생성 중...");
  const result = await api("/api/generate", {
    method: "POST",
    body: JSON.stringify({
      title: form.get("title"),
      keyword: form.get("keyword")
    })
  });
  log(result);
});

await Promise.all([loadStatus(), loadStrategy(), runAudit(), loadBook()]);
loadChecklist();

# Codex Gemma AdSense Blog Kit

Installed path: `F:\codex-gemma-adsense-blog`

This project adapts the Wikidocs book structure at https://wikidocs.net/book/20190 into a local, low-cost workflow:

- Gemma 4 through Ollama for recurring drafts
- Codex CLI with ChatGPT OAuth for coding and release review
- Hermes as an optional provider/agent hub
- GitHub Pages for static deployment
- A local dashboard for status, generation, approval checks, and manual steps

## Quick Start

```powershell
cd F:\codex-gemma-adsense-blog
Copy-Item .env.example .env
npm install
.\scripts\start-ollama-f.ps1
.\scripts\pull-gemma4.ps1 -Model gemma4:e2b
npm run build
npm run serve
```

Open `http://127.0.0.1:4871`.

## Useful Commands

```powershell
npm run status
npm run generate -- --title "글 제목" --keyword "핵심 키워드"
npm run approve
npm run build
.\scripts\codex-oauth-check.ps1
.\scripts\hermes-check.ps1
```

## Important Safety Defaults

- AdSense is disabled until `ADSENSE_ENABLED=true` and `ADSENSE_CLIENT` are set.
- Codex OAuth credentials are not copied into this project.
- GitHub Actions builds and deploys static files only; it does not run Codex OAuth or local Gemma.
- Generated drafts are drafts. Review them before publishing.

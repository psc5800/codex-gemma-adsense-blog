# 운영 매뉴얼

## 최초 실행

```powershell
cd F:\codex-gemma-adsense-blog
Copy-Item .env.example .env
npm install
.\scripts\start-ollama-f.ps1
.\scripts\pull-gemma4.ps1 -Model gemma4:e2b
npm run build
npm run serve
```

대시보드는 `http://127.0.0.1:4871`에서 열립니다.

## 매일 루틴

```powershell
npm run generate -- --title "오늘의 글 제목" --keyword "핵심 키워드"
npm run approve
npm run build
git add content site data docs src public scripts .github package.json
git commit -m "Publish new draft"
git push
```

## GitHub Pages

1. GitHub에 새 저장소를 만듭니다.
2. 이 폴더를 저장소로 초기화하고 원격을 연결합니다.
3. Settings -> Pages -> Source를 GitHub Actions로 설정합니다.
4. `main` 브랜치에 push하면 `.github/workflows/pages.yml`이 `site/`를 배포합니다.

## 자동 작업

Windows 작업 스케줄러 등록은 기본적으로 실행하지 않습니다. 내용을 확인한 뒤 아래처럼 등록하세요.

```powershell
.\scripts\setup-windows-task.ps1 -Register -At 08:30
```

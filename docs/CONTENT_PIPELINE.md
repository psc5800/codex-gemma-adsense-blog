# 콘텐츠 파이프라인

## 로컬 초안 생성

```powershell
.\scripts\start-ollama-f.ps1
.\scripts\pull-gemma4.ps1 -Model gemma4:e2b
npm run generate -- --title "글 제목" --keyword "핵심 키워드"
```

`gemma4:e2b`를 기본으로 둔 이유는 용량과 품질의 균형입니다. 더 긴 글과 까다로운 추론이 필요하면 `.env`의 `OLLAMA_MODEL`을 `gemma4:12b`로 바꾼 뒤 다시 테스트하세요.

## 검수 기준

- 제목이 같은 기존 글이 없는지 확인
- 본문이 독자 문제를 직접 해결하는지 확인
- 표, 체크리스트, 한계 설명이 있는지 확인
- 근거가 필요한 수치나 최신 정보는 별도 출처 확인
- AdSense 승인 전 광고 스크립트 비활성 유지

## 빌드

```powershell
npm run approve
npm run build
```

빌드 결과는 `site/`에 생성됩니다. GitHub Pages Actions는 이 폴더를 배포합니다.

# Codex OAuth 운영

## 확인 명령

```powershell
.\scripts\codex-oauth-check.ps1
```

현재 로컬 Codex Doctor는 ChatGPT OAuth 인증과 WebSocket 연결을 통과했습니다. WindowsApps의 `codex` 별칭은 권한 문제를 낼 수 있어, 스크립트는 `.codex/config.toml`에 기록된 실제 Codex 실행 파일 경로를 우선 사용합니다.

## 추천 사용처

- 정적 사이트 생성기 수정
- GitHub Actions 오류 해결
- 발행 전 저장소 리뷰
- 대규모 리팩터링이나 배포 문제 조사

## 피해야 할 사용처

- 매일 반복되는 대량 글 초안 생성
- GitHub Actions 안에 OAuth 토큰을 복사하는 방식
- 사람이 읽지 않은 글의 자동 발행

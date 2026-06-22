# 비용 최소화 전략

## 결론

기본 루프는 `Gemma 4 로컬 초안 생성 -> 사람 검수 -> Codex OAuth로 코드/배포 문제 해결 -> GitHub Pages 배포`입니다. 이 방식은 반복 글 초안의 토큰 비용을 로컬 추론으로 줄이고, 고난도 저장소 작업에만 Codex를 씁니다.

## 역할 분담

| 작업 | 기본 도구 | 이유 |
| --- | --- | --- |
| 키워드 묶기, 글 초안, 메타 설명 | Ollama Gemma 4 | 로컬 실행이라 반복 비용이 낮음 |
| 빌드 오류, 자동화 수정, 코드 리뷰 | Codex CLI OAuth | 이미 ChatGPT OAuth로 인증됨 |
| 보조 에이전트, provider 전환, 원격 gateway | Hermes | 설치되어 있고 Nous Portal + Codex OAuth 감지됨 |
| 배포 | GitHub Pages Actions | 정적 파일만 배포하므로 서버 비용 없음 |

## Codex OAuth 주의점

Codex OAuth는 로컬 개발자 환경에서 쓰는 것이 안전합니다. GitHub Actions에 OAuth 토큰을 복사해 넣지 마세요. CI에서 모델 호출이 꼭 필요하면 별도 API 키와 예산 제한을 둔 워크플로를 분리하는 편이 낫습니다.

## Hermes 검토

Hermes는 이미 설치되어 있고 `hermes status` 기준으로 Nous Portal과 OpenAI Codex OAuth를 인식합니다. 다만 이 블로그의 핵심 루프는 단순합니다. Hermes를 기본 경로에 넣으면 강력하지만 운영면이 복잡해지므로, 기본은 Ollama + Node 스크립트로 두고 Hermes는 필요할 때 보조 에이전트로 호출합니다.

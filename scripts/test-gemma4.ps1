param(
  [string]$Model = "gemma4:e2b"
)

$ErrorActionPreference = "Stop"
$env:OLLAMA_HOST = "127.0.0.1:11435"
$Prompt = "한국어로 한 문장만 답하세요. GitHub Pages 블로그 자동화에서 가장 먼저 확인할 것은?"
ollama run $Model $Prompt

param(
  [string]$Model = "gemma4:e2b"
)

$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "start-ollama-f.ps1")
$env:OLLAMA_HOST = "127.0.0.1:11435"
$env:OLLAMA_MODELS = Join-Path (Resolve-Path (Join-Path $PSScriptRoot "..")) ".ollama\models"

Write-Host "Pulling $Model into $env:OLLAMA_MODELS"
ollama pull $Model
Write-Host "Done. Test with: .\scripts\test-gemma4.ps1 -Model $Model"

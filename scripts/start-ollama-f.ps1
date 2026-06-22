param(
  [string]$HostAddress = "127.0.0.1:11435"
)

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ModelDir = Join-Path $Root ".ollama\models"
$LogDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $ModelDir, $LogDir | Out-Null

$Api = "http://$HostAddress"
$env:OLLAMA_HOST = $HostAddress
$env:OLLAMA_MODELS = $ModelDir

try {
  Invoke-RestMethod -Uri "$Api/api/tags" -TimeoutSec 2 | Out-Null
  Write-Host "Ollama already running at $Api"
  return
} catch {
  Write-Host "Starting isolated Ollama at $Api"
}

$Ollama = (Get-Command ollama -ErrorAction Stop).Source
$OutLog = Join-Path $LogDir "ollama.out.log"
$ErrLog = Join-Path $LogDir "ollama.err.log"
$Process = Start-Process -FilePath $Ollama -ArgumentList "serve" -WindowStyle Hidden -PassThru -RedirectStandardOutput $OutLog -RedirectStandardError $ErrLog
$Process.Id | Set-Content -Path (Join-Path $LogDir "ollama.pid")

for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    Invoke-RestMethod -Uri "$Api/api/tags" -TimeoutSec 2 | Out-Null
    Write-Host "Ollama ready. PID=$($Process.Id), models=$ModelDir"
    return
  } catch {}
}

throw "Ollama did not become ready. Check $ErrLog"

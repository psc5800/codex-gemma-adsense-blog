param(
  [switch]$Register,
  [string]$TaskName = "CodexGemmaBlogDaily",
  [string]$At = "08:30"
)

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ActionScript = Join-Path $Root "scripts\daily-publish.ps1"

if (-not (Test-Path $ActionScript)) {
  @"
`$ErrorActionPreference = "Stop"
Set-Location "$Root"
`$env:OLLAMA_HOST = "http://127.0.0.1:11435"
npm run generate -- --title "오늘의 운영 노트" --keyword "정적 블로그 운영"
npm run approve
npm run build
git status --short
"@ | Set-Content -Path $ActionScript -Encoding UTF8
}

if (-not $Register) {
  Write-Host "Dry run. To register the task:"
  Write-Host ".\scripts\setup-windows-task.ps1 -Register -At $At"
  Write-Host "Script: $ActionScript"
  exit 0
}

$Time = [DateTime]::Parse($At)
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$ActionScript`""
$Trigger = New-ScheduledTaskTrigger -Daily -At $Time
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Trigger -Settings $Settings -Description "Generate and build the Codex Gemma static blog" -Force | Out-Null
Write-Host "Registered $TaskName at $At"

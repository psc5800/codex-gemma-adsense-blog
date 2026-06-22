$ErrorActionPreference = "Stop"
$Config = Join-Path $env:USERPROFILE ".codex\config.toml"
$Codex = $null
if (Test-Path $Config) {
  $Match = Select-String -Path $Config -Pattern "CODEX_CLI_PATH\s*=\s*'([^']+)'" | Select-Object -First 1
  if ($Match) { $Codex = $Match.Matches[0].Groups[1].Value }
}
if (-not $Codex -or -not (Test-Path $Codex)) {
  $Codex = (Get-Command codex -ErrorAction Stop).Source
}

Write-Host "Using Codex: $Codex"
& $Codex login status
& $Codex doctor --summary

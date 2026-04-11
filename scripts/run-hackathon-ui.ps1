# Ember — hackathon frontend only (no blockchain).
# Public demo: run ngrok in another terminal:  ngrok http 5173  (use your reserved domain if configured)
# When you need chain again:  npm run node  then  npm run deploy:local  (separate terminals)

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Starting Vite on 0.0.0.0:5173 (local + LAN). Ngrok should forward to localhost:5173." -ForegroundColor Cyan
Write-Host "Allowed ngrok host: moody-supplier-map.ngrok-free.dev (see vite.config.ts)" -ForegroundColor DarkGray

npm run dev

$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "==================" -ForegroundColor Cyan
Write-Host "Starting Ember Fully (Node -> Compile -> Deploy -> UI)" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan

# 1. Kill any existing nodes so port 8545 and port 5173 is clean
Write-Host "Cleaning up old node processes..." -ForegroundColor DarkGray
Get-Process node, powershell -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match "EmberNode|EmberUI" } | Stop-Process -Force -ErrorAction SilentlyContinue

# 2. Launching Hardhat node in a dedicated window
Write-Host "Starting Local Hardhat Node..." -ForegroundColor Yellow
$nodeProc = Start-Process powershell -ArgumentList "-WindowStyle Normal -Title 'EmberNode' -NoExit -Command `"npm run node`"" -PassThru
Start-Sleep -Seconds 6 # Let it boot

# 3. Compile & Deploy
Write-Host "Deploying Contracts via Hardhat..." -ForegroundColor Green
npm run deploy:local

# 4. Launch Vite UI in a dedicated window
Write-Host "Starting UI Server..." -ForegroundColor Magenta
$uiProc = Start-Process powershell -ArgumentList "-WindowStyle Normal -Title 'EmberUI' -NoExit -Command `"npm run dev`"" -PassThru

Write-Host "All set! The node is running on 8545 and Frontend is running on 5173." -ForegroundColor Cyan

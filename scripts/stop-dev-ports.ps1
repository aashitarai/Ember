$ports = 5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 8545
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $procId = $_.OwningProcess
    Write-Host "Stopping PID $procId on port $port"
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
  }
}
Write-Host "Done."

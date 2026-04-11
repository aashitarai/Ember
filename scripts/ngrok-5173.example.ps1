# Example: expose the Ember app for judges (HTTPS public URL -> your Vite dev server).
# 1) Start the app first:  npm run dev   OR   .\scripts\run-hackathon-ui.ps1
# 2) In a second terminal, from the folder where ngrok.exe lives:
#
#    ngrok http 5173
#
# If you use a reserved domain in the ngrok dashboard, it may show as:
#    https://moody-supplier-map.ngrok-free.dev -> http://localhost:5173
#
# Judges open the https://....ngrok-free.dev link in the browser (not the RPC URL).

Write-Host @"
Commands (run ngrok where ngrok.exe is installed):

  ngrok config add-authtoken YOUR_TOKEN_HERE
  ngrok http 5173

vite.config.ts allows Host: moody-supplier-map.ngrok-free.dev
"@

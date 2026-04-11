import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Hackathon / ngrok: public URL must match your reserved ngrok host.
// Localhost kept so `npm run dev` still works on your laptop.
const NGROK_HOST = 'moody-supplier-map.ngrok-free.dev'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: [NGROK_HOST, 'localhost', '127.0.0.1'],
  },
})

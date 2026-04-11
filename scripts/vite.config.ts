import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['moody-supplier-map.ngrok-free.dev','https://stoic-species-prowler.ngrok-free.dev'],
  },
})
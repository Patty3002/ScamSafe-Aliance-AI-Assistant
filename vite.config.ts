import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['scamsafe-aliance-ai-assistant.onrender.com'],
  },
})

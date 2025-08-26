import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
    preview: {
    allowedHosts: [
      "deployrailway-production-faee.up.railway.app"
    ]
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    strictPort: false,
    origin: 'https://b6eb-201-183-99-16.ngrok-free.app'
  }
})
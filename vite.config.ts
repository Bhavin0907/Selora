import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Standard Vite env load: .env, .env.local, .env.[mode], .env.[mode].local
  envPrefix: 'VITE_',
})

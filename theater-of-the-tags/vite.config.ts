import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode })=> {
  return {
    plugins: [vue()],
    base: '/',
    server: {
      host: true,
      allowedHosts: [
        'localhost',
        'tags.avomath.com'
      ]
    }
  }
})

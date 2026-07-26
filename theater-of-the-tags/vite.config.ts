import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode })=> {
  const buildId = process.env.VITE_BUILD_ID?.trim()
    || (mode === 'development' ? 'development' : new Date().toISOString())
  const buildInfo = JSON.stringify({ buildId })

  return {
    plugins: [
      vue(),
      {
        name: 'build-id',
        configureServer(server) {
          server.middlewares.use('/build-id.json', (_request, response)=> {
            response.setHeader('Content-Type', 'application/json')
            response.setHeader('Cache-Control', 'no-store')
            response.end(buildInfo)
          })
        },
        generateBundle() {
          this.emitFile({
            type: 'asset',
            fileName: 'build-id.json',
            source: buildInfo,
          })
        },
      },
    ],
    define: {
      __BUILD_ID__: JSON.stringify(buildId),
    },
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

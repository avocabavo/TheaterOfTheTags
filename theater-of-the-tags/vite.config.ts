import { defineConfig } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode })=> {
  const useWebRTC = mode === 'webrtc'
  return {
    resolve: {
      alias: {
        './libyjs': path.resolve(
          __dirname,
          useWebRTC ? './src/lib/yjs-webrtc.ts' : './src/lib/yjs'
        )
      }
    },
    plugins: [vue()],
    base: '/theater-of-the-tags/',
  }
})

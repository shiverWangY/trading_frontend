import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  // GitHub Pages 部署时需要设置 base 路径
  // 如果部署到 https://username.github.io/repo-name/，设置为 '/repo-name/'
  // 如果部署到 https://username.github.io/，设置为 '/'
  base: '/',
  
  plugins: [vue()],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}))

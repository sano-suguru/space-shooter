import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/space-shooter/',
    plugins: [react()],
    esbuild: {
        // JSXファイルのサポート
        jsx: 'automatic'
    },
    server: {
        // 開発サーバー設定
        port: 5173,
        open: true
    }
})

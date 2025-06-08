import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
    base: '/space-shooter/',
    plugins: [
        react(),
        visualizer({
            filename: 'dist/bundle-analysis.html',
            open: false,
            gzipSize: true,
            brotliSize: true
        })
    ],
    esbuild: {
        // JSXファイルのサポート
        jsx: 'automatic'
    },
    server: {
        // 開発サーバー設定
        port: 5173,
        open: true
    },
    build: {
        // バンドル分析のための設定
        rollupOptions: {
            output: {
                manualChunks: {
                    // React関連を別チャンクに分離
                    react: ['react', 'react-dom'],
                    // ゲームエンジン関連
                    game: [
                        './src/core/Game.ts',
                        './src/core/GameEngine.ts',
                        './src/managers/GameObjectManager.ts'
                    ],
                    // プログレッション関連
                    progression: [
                        './src/progression/managers/ProgressManager.ts',
                        './src/progression/managers/UpgradeManager.ts',
                        './src/progression/managers/AchievementManager.ts'
                    ]
                }
            }
        }
    }
})

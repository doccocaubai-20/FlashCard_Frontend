import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['ap2.png'],
            manifest: {
                name: 'ChongZi - Học tiếng Trung thông minh',
                short_name: 'ChongZi',
                description: 'Ứng dụng học tiếng Trung Quốc với Flashcard, AI, và Gamification',
                theme_color: '#0F5257',
                background_color: '#f8f9fa',
                display: 'standalone',
                icons: [
                    { src: 'ap2.png', sizes: '192x192', type: 'image/png' },
                    { src: 'ap2.png', sizes: '512x512', type: 'image/png' }
                ]
            },
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                globIgnores: ['**/log.png'],
                runtimeCaching: [
                    {
                        urlPattern: /\/api\//,
                        handler: 'StaleWhileRevalidate',
                        options: {
                            cacheName: 'api-cache',
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com|^https:\/\/fonts\.gstatic\.com|\/fonts\//,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'images-cache',
                            expiration: {
                                maxAgeSeconds: 60 * 60 * 24 * 30,
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
})
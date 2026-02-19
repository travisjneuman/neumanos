import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import { execFileSync } from 'child_process'
import { platformDocsPlugin } from './config/vite-plugin-platform-docs'

// Get git commit hash for build identification
// Uses execFileSync (not exec) to avoid shell injection - hardcoded args only
function getGitCommitHash(): string {
  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf-8' }).trim()
  } catch {
    return 'unknown'
  }
}

// Get git commit timestamp for the current HEAD
// Returns ISO 8601 timestamp of when the commit was made
function getGitCommitTimestamp(): string {
  try {
    // %cI = committer date in strict ISO 8601 format
    return execFileSync('git', ['log', '-1', '--format=%cI', 'HEAD'], { encoding: 'utf-8' }).trim()
  } catch {
    return new Date().toISOString() // Fallback to build time
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Inject build info as global constants
  define: {
    __BUILD_HASH__: JSON.stringify(getGitCommitHash()),
    __BUILD_TIMESTAMP__: JSON.stringify(getGitCommitTimestamp()),
  },

  plugins: [
    react(),
    platformDocsPlugin(),
    VitePWA({
      registerType: 'prompt', // Show update prompt to user
      includeAssets: [
        'favicon.ico',
        'images/favicon/*.png',
        'images/favicon/site.webmanifest'
      ],
      manifest: {
        name: 'NeumanOS - Personal Command Center',
        short_name: 'NeumanOS',
        description: 'Your Personal Command Center for productivity and organization',
        theme_color: '#3b82f6',
        background_color: '#0a0e27',
        display: 'standalone',
        start_url: '/',
        orientation: 'portrait-primary',
        categories: ['productivity', 'utilities'],
        icons: [
          {
            src: '/images/favicon/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/images/favicon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/images/favicon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Precache static assets (exclude large files and stats)
        globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],
        // Exclude stats.html (bundle analyzer) and large logos from precache
        globIgnores: ['**/stats.html', '**/images/logos/*'],
        // Allow slightly larger files for critical assets
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
        // Runtime caching for fonts and images
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            // Google Fonts webfonts
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // External CDN images (OpenStreetMap tiles, etc.)
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        // Clean old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for old service worker
        skipWaiting: false, // Controlled by prompt
        clientsClaim: false // Controlled by prompt
      },
      devOptions: {
        enabled: false, // Disable SW in dev mode to avoid caching issues
        type: 'module'
      }
    }),
    visualizer({
      open: false, // Don't auto-open browser (manual check via stats.html)
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    })
  ],

  // CSS configuration with PostCSS
  css: {
    postcss: './config/postcss.config.js',
  },

  // Base public path - use '/' for root domain deployment
  base: '/',

  // Build optimizations
  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for production debugging (optional)
    sourcemap: false,

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options with manual chunking for vendors, UI, and stores
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk: React core and router
          vendor: ['react', 'react-dom', 'react-router-dom'],

          // UI chunk: Component libraries
          ui: [
            'framer-motion',
            'lucide-react',
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities'
          ],

          // Charts chunk: Heavy visualization libraries
          charts: ['recharts', 'd3'],

          // Canvas chunk: Konva for diagrams
          canvas: ['konva', 'react-konva'],

          // Store chunk: State management
          store: ['zustand', 'dexie']

          // Note: Lexical and XTerm chunked automatically via dynamic imports
        }
      }
    },
  },

  // Development server
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    // Cross-Origin Isolation headers for WebContainer (Phantom Shell)
    // Using 'credentialless' to allow OpenStreetMap tiles while enabling SharedArrayBuffer
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
})

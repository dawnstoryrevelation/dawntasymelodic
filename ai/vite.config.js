import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  // Base path for subdomain deployment
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'DawntasyAI',
        short_name: 'DawntasyAI',
        description: 'Your cosmic AI companion',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    // Custom plugin to copy _redirects file to output directory
    {
      name: 'copy-netlify-redirects',
      closeBundle() {
        const redirectsContent = '/* /index.html 200';
        const outputDir = 'dist-ai';

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write _redirects file to output directory
        fs.writeFileSync(path.resolve(outputDir, '_redirects'), redirectsContent);
        console.log('✅ Created _redirects file in output directory');
      }
    }
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'firebase-app': path.resolve(__dirname, 'node_modules/firebase/app/dist/index.cjs')
    }
  },
  server: {
    port: 5173,
    fs: {
      strict: false // Required for large prompt files
    }
  },
  build: {
    outDir: 'dist-ai', // Ensure this matches Netlify publish dir
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    sourcemap: process.env.NODE_ENV === 'development',
    
    // 🔥🔥🔥 CRITICAL FIX: Prevent aggressive tree-shaking 🔥🔥🔥
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/]
    },

    
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'SOURCEMAP_ERROR' || warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
      },
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      },
      
      // 🔥🔥🔥 CRITICAL FIX: Disable aggressive tree-shaking for Vue and Firebase 🔥🔥🔥
      treeshake: {
        moduleSideEffects: true, // IMPORTANT: Preserve all side effects!
        preset: 'recommended',
        propertyReadSideEffects: true
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        keep_fnames: true,
        drop_console: false,
        drop_debugger: true
      },
      // 🔥🔥🔥 CRITICAL FIX: Keep classes and functions needed by Vue 🔥🔥🔥
      mangle: {
        keep_classnames: true,
        keep_fnames: true
      }
    }
  },
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'firebase/app',
      'firebase/auth',
      'gsap',
      'three',
      'axios'
    ],
    exclude: ['@rollup/plugin-alias']
  },
  define: {
    'process.env': process.env
  },
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://*.firebaseio.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: https://*.googleusercontent.com https://*.firebasestorage.googleapis.com https://storage.googleapis.com https://www.gstatic.com https://ssl.gstatic.com; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://us-central1-dawntasyai.cloudfunctions.net https://*.firebaseio.com wss://*.firebaseio.com https://firestore.googleapis.com https://*.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.openai.com https://api.fireworks.ai blob: http://localhost:* ws://localhost:*; frame-src 'self' https://*.firebaseapp.com;"
    }
  }
  // ... rest of your config
});
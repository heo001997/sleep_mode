import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react({
        // Enable React Fast Refresh for development
        fastRefresh: command === 'serve',
        // Optimize React in production
        jsxRuntime: 'automatic',
      }),
    ],

    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@components': resolve(__dirname, './src/components'),
        '@pages': resolve(__dirname, './src/pages'),
        '@hooks': resolve(__dirname, './src/hooks'),
        '@services': resolve(__dirname, './src/services'),
        '@utils': resolve(__dirname, './src/utils'),
        '@types': resolve(__dirname, './src/types'),
        '@assets': resolve(__dirname, './src/assets'),
        '@styles': resolve(__dirname, './src/styles'),
      },
    },

    // CSS configuration
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: mode === 'production' 
          ? '[hash:base64:5]' 
          : '[name]__[local]___[hash:base64:5]',
      },
      postcss: './postcss.config.js',
    },

    // Build configuration
    build: {
      outDir: 'dist',
      manifest: true,
      emptyOutDir: true,
      sourcemap: mode === 'production' ? 'hidden' : true,
      minify: mode === 'production' ? 'terser' : false,
      
      // CDN configuration for production
      ...(mode === 'production' && env.VITE_ASSETS_CDN && {
        assetsDir: 'assets',
        publicPath: env.VITE_ASSETS_CDN + '/',
      }),
      
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
          dead_code: true,
          booleans: true,
        },
        mangle: {
          toplevel: true,
        },
        format: {
          comments: false,
        },
      },

      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        
        output: {
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name!.split('.')
            const extType = info[info.length - 1]
            
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `assets/images/[name]-[hash].[ext]`
            }
            if (/woff2?|eot|ttf|otf/i.test(extType)) {
              return `assets/fonts/[name]-[hash].[ext]`
            }
            if (/css/i.test(extType)) {
              return `assets/css/[name]-[hash].[ext]`
            }
            return `assets/[ext]/[name]-[hash].[ext]`
          },
          
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-ui': ['@headlessui/react', '@heroicons/react'],
            'vendor-utils': ['@tanstack/react-query', 'axios'],
          },
        },
        
        treeshake: {
          preset: 'recommended',
          moduleSideEffects: false,
        },
      },

      chunkSizeWarningLimit: 500,
      cssCodeSplit: true,
      assetsInlineLimit: 4096,
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
    },

    // Development server configuration
    server: {
      port: 3000,
      host: true,
      open: false,
      cors: true,
      
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },

    // Preview server configuration
    preview: {
      port: 3000,
      host: true,
      cors: true,
    },

    // Environment variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Optimization configuration
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@headlessui/react',
        '@heroicons/react',
        '@tanstack/react-query',
        'axios',
      ],
      
      esbuildOptions: {
        target: 'es2020',
        jsx: 'automatic',
        treeShaking: true,
      },
    },

    // ESBuild configuration
    esbuild: {
      jsx: 'automatic',
      jsxDev: command === 'serve',
      target: 'es2020',
      
      ...(mode === 'production' && {
        drop: ['console', 'debugger'],
        legalComments: 'none',
        minifyIdentifiers: true,
        minifySyntax: true,
        minifyWhitespace: true,
      }),
    },

    // Cache configuration
    cacheDir: 'node_modules/.vite',
    envPrefix: 'VITE_',
    logLevel: mode === 'production' ? 'warn' : 'info',
  }
})

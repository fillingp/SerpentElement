import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE'),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || 'AIzaSyBOBpBZzCZdg6ugSNHrWTWih4SQPvPMGYE')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['lit', '@google/genai'],
              three: ['three']
            }
          }
        }
      },
      server: {
        port: 3000,
        host: true
      }
    };
});

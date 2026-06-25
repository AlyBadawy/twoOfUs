import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Output lands directly inside the Spring Boot static resource folder
    outDir: '../backend/src/main/resources/static',
    emptyOutDir: true,
  },
  server: {
    // Proxy API calls to the Spring Boot backend during local development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});

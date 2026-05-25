import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:5005',
      '/api': 'http://localhost:5005',
      '/socket.io': {
        target: 'http://localhost:5005',
        ws: true
      }
    }
  }
});

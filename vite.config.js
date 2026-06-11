import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-player client-side game. No backend.
export default defineConfig({
  plugins: [react()],
  base: './',
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
});

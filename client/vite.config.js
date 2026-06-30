import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // host: true => ook bereikbaar via je lokale IP (bv. om op je telefoon te
    // testen op hetzelfde wifi-netwerk: http://<jouw-ip>:5173).
    host: true,
    // Stuur /api door naar de Express-backend tijdens ontwikkeling.
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
});

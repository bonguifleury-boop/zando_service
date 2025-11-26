import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [visualizer({ open: true, gzipSize: true, brotliSize: true })],
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const moduleName = id.toString().split('node_modules/')[1].split('/')[0];
            if (['react', 'react-dom', 'firebase', 'lodash', 'recharts'].includes(moduleName)) {
              return moduleName;
            }
          }
        },
      },
    },
  },
});

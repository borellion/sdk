import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte({ emitCss: false })],
  build: {
    lib: {
      entry: 'src/Borellion.svelte',
      name: 'Borellion',
      fileName: 'borellion-threlte-sdk',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['three', '@threlte/core', 'svelte', /^svelte\//],
    },
  },
});

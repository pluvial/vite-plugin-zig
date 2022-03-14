import adapter from '@sveltejs/adapter-static';
import zig from 'vite-plugin-zig';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    prerender: {
      default: true,
    },
    vite: {
      plugins: [zig()],
    },
  },
};

export default config;

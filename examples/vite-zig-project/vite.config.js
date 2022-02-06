import inspect from 'vite-plugin-inspect';
import zig from 'vite-plugin-zig';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [zig(), inspect()],
  build: { target: 'esnext' },
};

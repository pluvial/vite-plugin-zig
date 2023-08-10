import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import zig from 'vite-plugin-zig';

export default defineConfig({
	plugins: [sveltekit(), zig()]
});

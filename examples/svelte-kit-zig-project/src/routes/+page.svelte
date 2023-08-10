<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    const wasm = await import('$lib/main.zig?instantiate');
    await wasm.instantiated;
    console.log(wasm.exports.add(5, 37)); // 42
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

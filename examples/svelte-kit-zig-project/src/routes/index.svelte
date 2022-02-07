<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    const wasm = await import('$lib/main.zig');
    await wasm.promise;
    const a = 2;
    const b = 3;
    console.log(`Calling zig wasm: ${a} + ${b} = ${wasm.exports.add(a, b)}`);
  });
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation
</p>

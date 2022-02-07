# vite-plugin-zig

Import WebAssembly modules compiled from Zig files.

## Prerequisites

- Install the [Zig compiler](https://ziglang.org): the binary can be downloaded from [downloads page](https://ziglang.org/download), or built from source by following the [GitHub Wiki instructions](https://github.com/ziglang/zig/wiki/Building-Zig-From-Source), or using the [zig-bootstrap](https://github.com/ziglang/zig-bootstrap) scripts.

## Usage

Install with `npm i -D vite-plugin-zig` (or `pnpm i -D` or `yarn i -D`), then add the plugin to your `vite.config.js`:

```js
// vite.config.js
import zig from 'vite-plugin-zig';

/** @type {import('vite').UserConfig} */
export default {
  plugins: [zig()],
  build: { target: 'esnext' },
};
```

Write your Zig code and `export` any symbol to be used in JS code:

```zig
// src/main.zig
export fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

If available, top-level await will be used so that importing the module is identical to importing a regular JS module:

```js
// example.js
import { exports, instance, module } from './src/main.zig';

console.log(exports.add(5, 37)); // 42
```

If your Vite config does not allow for top-level await (by setting `build: { target: 'esnext' }`, e.g. if the framework you're using enforces a specific target value), you can still access the exports the same way, but need to explicitly await the WebAssembly fetching + instantiation via the exported `promise` beforehand:

```js
// example.js
import { exports, instance, module, promise } from './src/main.zig';

(async () => {
  await promise;
  console.log(exports.add(5, 37)); // 42
})();
```

To integrate with SSR frameworks such as SvelteKit, use a dynamic import:

```svelte
<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    const wasm = await import('$lib/main.zig');
    await wasm.promise;
    console.log(wasm.exports.add(5, 37)); // 42
  });
</script>
```

## Notes and TODOs

- `instantiateStreaming()` may not be appropriate in some use cases, it may be better to use `compileStreaming` instead to give the caller more flexibility in the imports and memory used in instantiation
- It would be great to have something similar to Rust's `wasm-bindgen` to generate JS glue code and type definitions

## License

[MIT](LICENSE)

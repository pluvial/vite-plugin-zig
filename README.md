# vite-plugin-zig

Import WebAssembly modules compiled from Zig files.

## Prerequisites

- Install the [Zig compiler](https://ziglang.org): the binary can be downloaded from [downloads page](https://ziglang.org/download), or built from source by following the [GitHub Wiki instructions](https://github.com/ziglang/zig/wiki/Building-Zig-From-Source), or using the [zig-bootstrap](https://github.com/ziglang/zig-bootstrap) scripts. As an alternative, the [`@ziglang/cli`](https://github.com/pluvial/node-zig/tree/main/packages/cli) npm package can be added as a dependency, useful in a CI environment for instance.

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

If available, top-level await can be used so that importing the module feels similar to importing a regular JS module:

```js
// example.js
import { instantiate } from './src/main.zig';

// pass any custom importObject here, functions should be declared
// as extern in the Zig file
const importObject = {
  // ...
};
// instantiate the compiled WebAssembly module, can also be moved
// to a Worker for instantiation in another thread
const { exports, instance } = await instantiate(importObject);
// call exported functions from the exports object
console.log(exports.add(5, 37)); // 42
```

As a shorthand to avoid having to manually call `await instantiate()`, the `?instantiate` query parameter can be specified in the module import to both compile and instantiate the module at import time, allowing access to `instance` and `exports`:

```js
import { exports, instance, module } from './src/main.zig?instantiate';

// call exported functions from the exports object
console.log(exports.add(5, 37)); // 42
```

If your Vite config does not allow for top-level await (by setting `build: { target: 'esnext' }`, e.g. if the framework you're using enforces a specific target value), an alternative API is provided which instead exposes Promises (`compiled` and `instantiated` respectively depending on whether `?instantiate` is used) which resolve when the compilation or instantiation of the module are complete:

```js
// example.js
import { compiled, instantiate, module } from './src/main.zig';

(async () => {
  // `await compiled` can be used to populate the `module` import
  // manually before instantiation if necessary

  // pass any custom importObject here, functions should be declared
  // as extern in the Zig file
  const importObject = {
    // ...
  };
  // instantiate the compiled WebAssembly module, can also be moved
  // to a Worker for instantiation in another thread
  const { exports, instance } = await instantiate(importObject);
  // call exported functions from the exports object
  console.log(exports.add(5, 37)); // 42
})();
```

```js
// example.js
import {
  exports,
  instance,
  instantiated,
  module,
} from './src/main.zig?instantiate';

(async () => {
  // manually await to populate the imports
  await instantiated;
  // call exported functions from the exports object
  console.log(exports.add(5, 37)); // 42
})();
```

To integrate with SSR frameworks such as SvelteKit, use a dynamic import:

```svelte
<script>
  import { onMount } from 'svelte';

  onMount(async () => {
    const wasm = await import('$lib/main.zig?instantiate');
    await wasm.instantiated;
    console.log(wasm.exports.add(5, 37)); // 42
  });
</script>
```

## Notes and TODOs

- It would be great to have something similar to Rust's `wasm-bindgen` to generate JS glue code and type definitions

## License

[MIT](LICENSE)

# vite-plugin-zig

Import Wasm modules compiled from Zig files

## Prerequisites

- [Zig compiler](https://ziglang.org): the binary can be downloaded from [downloads page](https://ziglang.org/download), or built from source by following the [GitHub Wiki instructions](https://github.com/ziglang/zig/wiki/Building-Zig-From-Source), or using the [zig-bootstrap](https://github.com/ziglang/zig-bootstrap) scripts.

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

Zig files can then be imported using the usual ESM import syntax:

```zig
// ./src/main.zig
export fn add(a: i32, b: i32) i32 {
    return a + b;
}
```

```js
// example.js
import { exports, instance, module } from './src/main.zig';

console.log(exports.add(5, 41)); // 42
```

## Notes and TODOs

- `instantiateStreaming()` may not be appropriate in some use cases, it may be better to use `compileStreaming` instead to give the caller more flexibility in the imports and memory used in instantiation
- Top-level await is used to fetch the generated Wasm at module load time, does it make sense to provide a fallback for older browsers?
- It would be great to have something similar to Rust's `wasm-bindgen` to generate JS glue code and type definitions

## License

[MIT](LICENSE)

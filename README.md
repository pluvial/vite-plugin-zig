# vite-plugin-zig

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

## License

[MIT](LICENSE)

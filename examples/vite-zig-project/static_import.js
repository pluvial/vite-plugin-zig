import { instantiate, module } from './src/main.zig';

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

console.debug({ exports, instance, module });

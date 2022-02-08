import { exports, instance, module } from './src/main.zig?instantiate';

// call exported functions from the exports object
console.log(exports.add(5, 37)); // 42

console.debug({ exports, instance, module });

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, copyDefault, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && (copyDefault || key !== "default"))
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toESM = (module2, isNodeMode) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", !isNodeMode && module2 && module2.__esModule ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};
var __toCommonJS = /* @__PURE__ */ ((cache) => {
  return (module2, temp) => {
    return cache && cache.get(module2) || (temp = __reExport(__markAsModule({}), module2, 1), cache && cache.set(module2, temp), temp);
  };
})(typeof WeakMap !== "undefined" ? /* @__PURE__ */ new WeakMap() : 0);

// index.js
var vite_plugin_zig_exports = {};
__export(vite_plugin_zig_exports, {
  default: () => zig
});
var import_child_process = require("child_process");
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
var ext = ".zig";
var run = (p) => new Promise((resolve, reject) => {
  p.on("close", (code) => code === 0 ? resolve() : reject(new Error(`Command ${p.spawnargs.join(" ")} failed with error code: ${code}`)));
  p.on("error", reject);
});
function zig({ outDir = "wasm", tmpDir = os.tmpdir() } = {}) {
  let config;
  const map = /* @__PURE__ */ new Map();
  return {
    name: "vite-plugin-zig",
    async transform(code, id, options) {
      const [filename, raw_query] = id.split(`?`, 2);
      if (filename.endsWith(ext)) {
        const name = path.basename(filename).slice(0, -ext.length);
        const wasm_file = `${name}.wasm`;
        const temp_file = path.posix.join(tmpDir, wasm_file);
        const command = `zig build-lib -dynamic -rdynamic -target wasm32-freestanding ${true ? "-Drelease-small" : ""} -femit-bin=${temp_file} ${filename}`;
        const [cmd, ...args] = command.split(" ");
        const zig2 = (0, import_child_process.spawn)(cmd, args, { stdio: "inherit" });
        await run(zig2);
        const wasm = await fs.readFile(temp_file);
        const dir = path.posix.join(config.build.assetsDir, outDir);
        const output_file = path.posix.join(dir, wasm_file);
        const output_url = path.posix.join(config.base, output_file);
        map.set(output_file, wasm);
        const query = new URLSearchParams(raw_query);
        const instantiate = query.get("instantiate") !== null;
        const code2 = config.build.target === "esnext" ? instantiate ? `
const importObject = { env: { print(result) { console.log(result); } } };
export const { module, instance } = await WebAssembly.instantiateStreaming(fetch("${output_url}"), importObject);
export const { exports } = instance;
` : `
export const module = await WebAssembly.compileStreaming(fetch('${output_url}'));
export const instantiate = importObject => WebAssembly.instantiate(module, importObject).then(instance => {
  const { exports } = instance;
  return { instance, exports };
});
` : instantiate ? `
const importObject = { env: { print(result) { console.log(result); } } };
export let module, instance, exports;
export const instantiated = WebAssembly.instantiateStreaming(fetch("${output_url}"), importObject).then(result => {
  ({ module, instance } = result);
  ({ exports } = instance);
})
` : `
const importObject = { env: { print(result) { console.log(result); } } };
export let module;
export const compiled = WebAssembly.compileStreaming(fetch("${output_url}")).then(result => {
  module = result;
  return module;
})
export const instantiate = importObject => compiled.then(module => WebAssembly.instantiate(module, importObject).then(instance => {
  const { exports } = instance;
  return { instance, exports };
});
`;
        return {
          code: code2,
          map: { mappings: "" }
        };
      }
    },
    buildEnd() {
      map.forEach((wasm, output_file) => {
        this.emitFile({
          type: "asset",
          fileName: output_file,
          source: wasm
        });
      });
    },
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.replace(/^\//, "") || "";
        if (map.get(url)) {
          res.writeHead(200, { "Content-Type": "application/wasm" });
          res.end(map.get(url));
          return;
        }
        next();
      });
    }
  };
}
module.exports = __toCommonJS(vite_plugin_zig_exports);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});

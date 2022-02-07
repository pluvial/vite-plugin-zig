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
function zig() {
  let config;
  const map = /* @__PURE__ */ new Map();
  return {
    name: "vite-plugin-zig",
    async transform(code, id, options) {
      if (id.endsWith(ext)) {
        const name = path.basename(id).slice(0, -ext.length);
        const wasm_file = `${name}.wasm`;
        const temp_file = path.posix.join(os.tmpdir(), wasm_file);
        const cmd = `zig build-lib -dynamic -target wasm32-freestanding ${true ? "-Drelease-small" : ""} -femit-bin=${temp_file} ${id}`.split(" ");
        const zig2 = (0, import_child_process.spawn)(cmd[0], cmd.slice(1), { stdio: "inherit" });
        await run(zig2);
        const wasm = await fs.readFile(temp_file);
        const dir = path.posix.join(config.build.assetsDir, "wasm");
        const output_file = path.posix.join(dir, wasm_file);
        map.set(output_file, wasm);
        const code2 = config.build.target === "esnext" ? `
const importObject = { env: { print(result) { console.log(result); } } };
export const promise = WebAssembly.instantiateStreaming(fetch("${output_file}"), importObject);
export const { module, instance } = await promise;
export const { exports } = instance;
` : `
const importObject = { env: { print(result) { console.log(result); } } };
export let module, instance, exports;
export const promise = WebAssembly.instantiateStreaming(fetch("${output_file}"), importObject).then(result => {
  ({ module, instance } = result);
  ({ exports } = instance);
})
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
          res.writeHead(200, {
            "Content-Type": "application/wasm"
          });
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

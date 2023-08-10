var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var vite_plugin_zig_exports = {};
__export(vite_plugin_zig_exports, {
  default: () => zig
});
module.exports = __toCommonJS(vite_plugin_zig_exports);
var import_child_process = require("child_process");
var fs = __toESM(require("fs/promises"), 1);
var path = __toESM(require("path"), 1);
var os = __toESM(require("os"), 1);
var ext = ".zig";
var run = (p) => new Promise((resolve, reject) => {
  p.on(
    "close",
    (code) => code === 0 ? resolve() : reject(
      new Error(
        `Command ${p.spawnargs.join(
          " "
        )} failed with error code: ${code}`
      )
    )
  );
  p.on("error", reject);
});
function zig({ outDir = "wasm", tmpDir = os.tmpdir() } = {}) {
  let config;
  const map = /* @__PURE__ */ new Map();
  return {
    name: "vite-plugin-zig",
    // resolveId(source, importer, options) {
    //   console.log({ source, importer, options });
    // },
    // load(id, options) {
    //   console.log({ id, options });
    //   if (id.endsWith(ext)) {
    //     console.log(`load ${id}`);
    //   }
    // },
    async transform(code, id, options) {
      const [filename, raw_query] = id.split(`?`, 2);
      if (filename.endsWith(ext)) {
        const name = path.basename(filename).slice(0, -ext.length);
        const wasm_file = `${name}.wasm`;
        const temp_file = path.posix.join(tmpDir, wasm_file);
        const command = `zig build-lib -dynamic -rdynamic -target wasm32-freestanding ${// TODO: check for dev/prd here
        true ? "-Drelease-small" : ""} -femit-bin=${temp_file} ${filename}`;
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
          // moduleSideEffects: false,
        };
      }
    },
    // adapted from vite-plugin-wasm-pack
    buildEnd() {
      map.forEach((wasm, output_file) => {
        this.emitFile({
          type: "asset",
          fileName: output_file,
          // name: path.basename(output_file),
          source: wasm
        });
      });
    },
    // alternative approach used in vite-plugin-wasm-go
    // closeBundle() {
    //   map.forEach((value, output_file) => {
    //     const buildFilename = path.posix.join(buildConfig.build.outDir, output_file);
    //     await fs.mkdirs(path.dirname(buildFilename));
    //     await fs.writeFile(buildFilename, value);
    //   });
    // },
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    // adapted from vite-plugin-wasm-go
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

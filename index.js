import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

const ext = '.zig';

const run = p =>
  new Promise((resolve, reject) => {
    p.on('close', code =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `Command ${p.spawnargs.join(
                ' ',
              )} failed with error code: ${code}`,
            ),
          ),
    );
    p.on('error', reject);
  });

/**
 * @param {object} options
 * @param {string} options.outDir
 * @param {string} options.tmpDir
 * @returns {import('vite').Plugin}
 */
export default function zig({ outDir = 'wasm', tmpDir = os.tmpdir() } = {}) {
  /** @type {import('vite').ResolvedConfig} */
  let config;

  /** @type {Map<string, string>} */
  const map = new Map();

  return {
    name: 'vite-plugin-zig',
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
      // console.log({ code, id, options });
      const [filename, raw_query] = id.split(`?`, 2);
      if (filename.endsWith(ext)) {
        const name = path.basename(filename).slice(0, -ext.length);
        const wasm_file = `${name}.wasm`;
        const temp_file = path.posix.join(tmpDir, wasm_file);
        const command = `zig build-lib -dynamic -target wasm32-freestanding ${
          // TODO: check for dev/prd here
          true ? '-Drelease-small' : ''
        } -femit-bin=${temp_file} ${filename}`;
        const [cmd, ...args] = command.split(' ');
        const zig = spawn(cmd, args, { stdio: 'inherit' });
        await run(zig);
        const wasm = await fs.readFile(temp_file);
        // const wasm = await fs.readFile(output_file);
        const dir = path.posix.join(config.build.assetsDir, outDir);
        const output_file = path.posix.join(dir, wasm_file);
        const output_url = path.posix.join(config.base, output_file);
        map.set(output_file, wasm);
        // TODO: was previously using this.emitFile() to have Rollup emit the
        // file with the hashed filename and then referencing it in the exported
        // module, need to find an alternative as currently the wasm filename
        // has no hash
        // const wasm = await fs.readFile(output_file);
        // const referenceId = this.emitFile({
        //   type: 'asset',
        //   source: wasm,
        //   name: wasm_file,
        // });
        //  const output_url = `import.meta.ROLLUP_FILE_URL_${referenceId}`;

        const query = new URLSearchParams(raw_query);
        const instantiate = query.get('instantiate') !== null;
        const code =
          config.build.target === 'esnext'
            ? instantiate
              ? `
const importObject = { env: { print(result) { console.log(result); } } };
export const { module, instance } = await WebAssembly.instantiateStreaming(fetch("${output_url}"), importObject);
export const { exports } = instance;
`
              : `
export const module = await WebAssembly.compileStreaming(fetch('${output_url}'));
export const instantiate = importObject => WebAssembly.instantiate(module, importObject).then(instance => {
  const { exports } = instance;
  return { instance, exports };
});
`
            : instantiate
            ? `
const importObject = { env: { print(result) { console.log(result); } } };
export let module, instance, exports;
export const instantiated = WebAssembly.instantiateStreaming(fetch("${output_url}"), importObject).then(result => {
  ({ module, instance } = result);
  ({ exports } = instance);
})
`
            : `
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
          code,
          map: { mappings: '' },
          // moduleSideEffects: false,
        };
      }
    },
    // adapted from vite-plugin-wasm-pack
    buildEnd() {
      // copy xxx.wasm files to /assets/xxx.wasm
      map.forEach((wasm, output_file) => {
        this.emitFile({
          type: 'asset',
          fileName: output_file,
          // name: path.basename(output_file),
          source: wasm,
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
        const url = req.url?.replace(/^\//, '') || '';
        if (map.get(url)) {
          res.writeHead(200, { 'Content-Type': 'application/wasm' });
          res.end(map.get(url));
          return;
        }
        next();
      });
    },
  };
}

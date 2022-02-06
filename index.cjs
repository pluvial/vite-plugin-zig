const { spawn } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

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

/** @returns {import('vite').Plugin;} */
module.exports = function zig() {
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
      if (id.endsWith(ext)) {
        console.log(`transform ${id}`);
        const name = path.basename(id).slice(0, -ext.length);
        const wasm_file = `${name}.wasm`;
        const temp_file = path.posix.join(os.tmpdir(), wasm_file);
        const cmd = `zig build-lib -dynamic -target wasm32-freestanding ${
          // TODO: check for dev/prd here
          true ? '-Drelease-small' : ''
        } -femit-bin=${temp_file} ${id}`.split(' ');
        const zig = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });
        await run(zig);
        const wasm = await fs.readFile(temp_file);
        // const wasm = await fs.readFile(output_file);
        const dir = path.posix.join(config.build.assetsDir, 'wasm');
        const output_file = path.posix.join(dir, wasm_file);
        map.set(output_file, wasm);
        // const wasm = await fs.readFile(output_file);
        // const referenceId = this.emitFile({
        //   type: 'asset',
        //   source: wasm,
        //   name: wasm_file,
        // });
        // TODO: const url = `import.meta.ROLLUP_FILE_URL_${referenceId}`;
        return {
          code: `
const importObject = { env: { print(result) { console.log(result); } } };
export const { module, instance } = await WebAssembly.instantiateStreaming(fetch("${output_file}"), importObject);
export const { exports } = instance;
`,
          map: { mappings: '' },
          // moduleSideEffects: false,
        };
      }
    },
    // adapted from vite-plugin-wasm-pack
    buildEnd() {
      // copy xxx.wasm files to /assets/xxx.wasm
      map.forEach((wasm, output_file) => {
        console.log({ wasm, output_file });
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
          res.writeHead(200, {
            'Content-Type': 'application/wasm',
          });
          res.end(map.get(url));
          return;
        }
        next();
      });
    },
  };
};

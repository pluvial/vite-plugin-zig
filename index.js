import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

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
 * @returns {import('vite').Plugin;}
 */
export default function zig() {
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
        const cmd = `zig build-lib -dynamic -target wasm32-freestanding ${
          // TODO: check for dev/prd here
          true ? '-Drelease-small' : ''
        } --name ${name} ${id}`.split(' ');
        const zig = spawn(cmd[0], cmd.slice(1), { stdio: 'inherit' });
        await run(zig);
        const wasm_file = `${name}.wasm`;
        const wasm = await fs.readFile(path.resolve(wasm_file));
        const referenceId = this.emitFile({
          type: 'asset',
          source: wasm,
          name: wasm_file,
        });
        return {
          code: `
const importObject = { env: { print(result) { console.log(result); } } };
const url = import.meta.ROLLUP_FILE_URL_${referenceId};
export const { module, instance } = await WebAssembly.instantiateStreaming(fetch(url), importObject);
export const { exports } = instance;
`,
          map: { mappings: '' },
          moduleSideEffects: false,
        };
      }
    },
  };
}

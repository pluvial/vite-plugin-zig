/**
 * @returns {import('vite').Plugin;}
 */
export default function zig() {
  return {
    name: 'vite-plugin-zig',
    resolveId(source, importer, options) {
      console.log({ source, importer, options });
    },
    load(id, options) {
      console.log({ id, options });
    },
    transform(code, id, options) {
      console.log({ code, id, options });
    },
  };
}

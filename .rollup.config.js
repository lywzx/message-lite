/**
 * @type {import('@lywzx/rollup-build-scripts').IRollupConfig}
 */
module.exports = {
  ts: true,
  dts: true,
  tsconfigOverride: {
    compilerOptions: {
      module: 'ES2015',
    },
    include: ['src'],
    exclude: ['test']
  },
  inputPrefix: 'src',
  handleCopyPackageJson(config){
    return {
      ...config,
      scripts: {},
    }
  },
  external: [
  ],
};

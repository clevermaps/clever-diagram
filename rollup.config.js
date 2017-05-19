import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
import postcss from 'rollup-plugin-postcss';
import postcssModules from 'postcss-modules';
import uglify from 'rollup-plugin-uglify';

let pkg = require('./package.json');
let external = Object.keys(pkg.dependencies);

const cssExportMap = {};

export default {
  entry: 'src/Diagram.js',
  plugins: [
    postcss({
      plugins: [
        postcssModules({
          getJSON (id, exportTokens) {
            cssExportMap[id] = exportTokens;
          }
        })
      ],
      getExport (id) {
        return cssExportMap[id];
      }
    }),
    babel(babelrc()),
    uglify()
  ],
  globals:{
    "d3":"d3",
    "$klay":"$klay",
    "jsPlumb":"jsPlumb"
  },
  external: external,
  targets: [
    {
      dest: pkg.main,
      format: 'umd',
      moduleName: 'Diagram',
      sourceMap: true
    }
  ]
};

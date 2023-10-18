/** @type {import('next').NextConfig} */
const nextConfig = {}

// module.exports = nextConfig

//webpack.functions.js
// const nodeExternals = require('webpack-node-externals');

// module.exports = {
//   externals: [nodeExternals()],
// };

module.exports = {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      })
      return config
    },
}


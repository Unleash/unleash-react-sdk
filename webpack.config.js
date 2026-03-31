var path = require('node:path');

const getCommonConfig = (outputFileName) => ({
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: outputFileName,
    libraryTarget: 'commonjs2',
  },
  module: {
    rules: [
      {
        test: /\.tsx?|.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: ['commonjs', 'react', 'unleash-proxy-client'],
});

const client = {
  ...getCommonConfig('index.browser.js'),
  target: 'web',
};

const server = {
  ...getCommonConfig('index.js'),
  target: 'node',
};

module.exports = [client, server];

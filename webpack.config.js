const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.ts',
    output: {
      filename: 'editor.js',
      path: path.resolve(__dirname, 'dist'),
      library: {
        name: 'TinyWYSIWYG',
        type: 'umd',
        umdNamedDefine: true,
        export: 'default',
      },
    },
    devtool: isProduction ? false : 'source-map',
    devServer: {
      port: 8080,
      hot: true,
      static: {
        directory: path.join(__dirname, 'examples'),
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './examples/index.html',
        filename: 'index.html',
      }),
      ...(isProduction ? [new MiniCssExtractPlugin()] : []),
    ],
  };
};

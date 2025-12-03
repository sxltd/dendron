const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack')

module.exports = {
    mode: 'development',
    target: 'web',
    entry: {
      index: './src/index.tsx'
    },
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'static/js/[name].bundle.js',
      assetModuleFilename: 'static/media/[name].[hash][ext]'
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.scss', '.css'],
        fallback: {
          path: require.resolve('path-browserify'),
          process: require.resolve('process/browser')
        },
        alias: {
          'cytoscape/dist/cytoscape.umd.js': require.resolve('cytoscape')
        }
    },
    module: {
    rules: [
        {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
            presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript'
            ]
            }
        }
        },
        {
            test: /\.module\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  modules: true
                }
              },
              'sass-loader'
            ]
          },
          {
            test: /\.scss$/,
            exclude: /\.module\.scss$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
          },
          {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 'css-loader']
          }
    ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].styles.css'
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser'
      })
    ]
};
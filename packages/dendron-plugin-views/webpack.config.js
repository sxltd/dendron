const fs = require('fs')
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require("html-webpack-plugin");
const webpack = require('webpack')



module.exports = {

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
        serveIndex: false,
      },
    },
  
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
          process: require.resolve('process/browser'),
          querystring: require.resolve("querystring-es3")
        },
        alias: {
          'cytoscape/dist/cytoscape.umd.js': require.resolve('cytoscape')
        }
    },
    module: {
    rules: [
        {
          test: /\.m?js$/,
          resolve: {
            fullySpecified: false
          }
        },
        {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
            loader: 'babel-loader',
            options: {
            presets: [
                '@babel/preset-env',
                ['@babel/preset-react', {
                  runtime: 'automatic'
                }],
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
                  modules: {
                    namedExport: false
                  }
                }
              },
              'sass-loader'
            ]
          },
          {
            test: /\.scss$/,
            exclude: /\.module\.scss$/,
            use: [MiniCssExtractPlugin.loader, 
              {
                loader: 'css-loader',
                options: {
                  modules: false,
                }
              },
               'sass-loader']
          },
          {
            test: /\.css$/,
            use: [MiniCssExtractPlugin.loader, 
              {
                loader: 'css-loader',
                options: {
                  modules: false,
                }
              },
            ]
          }
    ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].styles.css'
      }),
      new HtmlWebpackPlugin({
        inject: true,
        templateContent: fs.readFileSync('./public/index.html', 'utf8'),
      }),
      new webpack.ProvidePlugin({
        process: 'process/browser'
      }),
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        'process.env.STAGE': JSON.stringify(process.env.STAGE || 'dev'),
        'process.env.REACT_APP_STAGE': JSON.stringify(process.env.REACT_APP_STAGE || 'dev'),
        'process.env.BUILD_STAGE': JSON.stringify(process.env.BUILD_STAGE),
        'process.env.GITHUB_ACTIONS': JSON.stringify(process.env.GITHUB_ACTIONS),
        'process.env.stage': JSON.stringify(process.env.stage)
      })
    ]
};
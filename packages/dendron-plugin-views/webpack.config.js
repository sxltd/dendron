const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.tsx',
    output: {
      path: path.resolve(__dirname, 'build'),
      filename: 'static/js/[name].bundle.js',
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js', '.jsx', '.scss', '.css'],
        fallback: {
          path: require.resolve('path-browserify')
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
              'style-loader',
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
            use: ['style-loader', 'css-loader', 'sass-loader']
          },
          {
            test: /\.css$/,
            use: ['style-loader', 'css-loader']
          }
    ]
    }
};
const path = require('path');

module.exports = {
  target: "node",
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: "commonjs2", 
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
        // TypeScript/TSX
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        // CSS files
        {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        },
        // SCSS modules
        {
          test: /\.module\.s[ac]ss$/i,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: true,
              },
            },
            "sass-loader",
          ],
        },
        // regular SCSS (non-module)
        {
          test: /\.s[ac]ss$/i,
          exclude: /\.module\.s[ac]ss$/i,
          use: ["style-loader", "css-loader", "sass-loader"],
        },
      ],
  }
};

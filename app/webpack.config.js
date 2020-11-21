const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env) => {
  const isProduction = env == 'production';

  return {
    entry: './src/app.jsx',
    output: {
      path: path.join(__dirname, 'public', 'dist'),
      filename: 'bundle.js',
    },
    module: {
      rules: [{
        loader: 'babel-loader',
        test: /\.jsx$/,
        exclude: /node_modules/,
      },{
        test: /\.s?css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {sourceMap: true},
          },{
            loader: 'sass-loader',
            options: {sourceMap: true},
          },
        ],
      }],
    },
    plugins: [new MiniCssExtractPlugin({filename:'styles.css'})],
    devtool: isProduction ? 'source-map' : 'inline-source-map',
    devServer: {
      host: '0.0.0.0',
      disableHostCheck: true,
      contentBase: path.join(__dirname, 'public'),
      public: 'localhost:8080/',
      publicPath: '/dist/',
      historyApiFallback: true,
    },
    performance: {
      hints: isProduction,
    }
  };
};

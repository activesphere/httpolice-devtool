var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin")
var production = process.env.NODE_ENV === 'production';

configObj = {
  entry:  {
    devtools: 'devtools',
    httpmon: 'httpmon',
    background: 'background',
    content_script: 'content_script',
    options: 'options',
  },
  output: {
    path:     'builds',
    filename: '[name].bundle.js',
  },
  resolve: {
    root: [
      path.join(__dirname),
      path.join(__dirname, 'js'),
      path.join(__dirname, 'js', 'panel'),
    ],
    extensions: ['', '.js']
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }],
    loaders: [
      {
        test:   /\.js$/,
        loader: 'babel',
        include: __dirname + '/js',
        exclude: /node_modules/,
        query: {
          presets: ['es2015']
        },
      },
      {
        test: /\.scss$/,
        loaders: ['style', 'css', 'sass']
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
    }),
    new CopyWebpackPlugin([
      { from: 'devtools.html' },
      { from: 'icons' },
      { from: 'js/panel/httpmon.html' },
      { from: 'manifest.json' },
      { from: 'options.html' },
    ], {
      // no specific options
    })
  ],
};

if (!production) {
  configObj.devtool = '#eval-source-map';
} else {
  configObj.plugins.push(new webpack.optimize.UglifyJsPlugin());
}

module.exports = configObj;

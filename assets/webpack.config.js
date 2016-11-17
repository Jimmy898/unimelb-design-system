require('dotenv').config();

var fs = require('fs');
var path = require('path');
var webpack = require('webpack');
var autoprefixer = require('autoprefixer');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

var WEB_SERVER_HOST = process.env.WEB_SERVER_HOST || 'localhost';
var ASSET_SERVER_PORT = process.env.ASSET_SERVER_PORT || 7001;
var ASSET_SERVER_URL = 'http://' + WEB_SERVER_HOST + ':' + ASSET_SERVER_PORT + '/';

var TARGETS = path.join(__dirname, 'targets');
var BUILD = path.join(__dirname, '..', 'build');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var isDev = process.env.NODE_ENV !== 'production';

// Webpack config
var config = {
  context: TARGETS,
  entry: fs.readdirSync(TARGETS).reduce(addEntry, {}),
  output: {
    path: BUILD,
    filename: '[name].js'
  },
  plugins: [
    new webpack.EnvironmentPlugin(['NODE_ENV', 'CDNURL', 'GMAPSJSAPIKEY'])
  ],
  module: {
    loaders: [
      {
        test: /\.(jpe?g|png|gif|svg|woff|ttf|otf|eot|ico)/,
        loader: 'file-loader?name=[path][name].[ext]'
      },
      {
        test: /\.es6?$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader'
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /(isotope-layout|imagesloaded)/,
        loader: 'imports?define=>false&this=>window'
      }
    ]
  },
  postcss: [
    autoprefixer({
      browsers: ['> 1% in AU', 'last 2 versions', 'Firefox ESR', 'ie >= 9', 'iOS >= 8.4', 'Safari >= 8', 'Android >= 4.4']
    })
  ]
};

// Development configuration
if (isDev) {
  config.output.publicPath = ASSET_SERVER_URL + 'assets/';
  config.devtool = 'eval-cheap-module-source-map';

  config.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  );

  config.module.loaders.push(
    {
      test: /\.scss$/,
      loader: 'style-loader!css-loader?-autoprefixer&sourceMap!postcss-loader!sass-loader'
    },
    {
      test: /\.css$/,
      loader: 'style-loader!css-loader?-autoprefixer&sourceMap!postcss-loader'
    }
  );

// Production configuration
} else {
  config.plugins.push(
    new ExtractTextPlugin('[name].css', { allChunks: true }),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
  );

  config.module.loaders.push(
    {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract(
        'style-loader',
        'css-loader?-autoprefixer&minimize!postcss-loader!sass-loader'
      )
    },
    {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract(
        'style-loader',
        'css-loader?-autoprefixer&minimize!postcss-loader'
      )
    }
  );
}

// Export configuration
module.exports = config;


/**
 * Add an entry for the given directory.
 * @param {Object} entries - the entries so far (reduce)
 * @param {String} dir - the name of the directory to process
 * @return {Object} - the `entries` object that includes the new entry
 */
function addEntry(entries, dir) {
  var dirPath = path.join(TARGETS, dir);

  // Add entries for directories only
  if (fs.lstatSync(dirPath).isDirectory()) {
    // Build the entry's targets array
    var targets = (isDev) ? ['webpack-dev-server/client?' + ASSET_SERVER_URL, 'webpack/hot/dev-server'] : [];
    addTarget(targets, dirPath, 'target.js');
    addTarget(targets, dirPath, 'index.scss');

    // Add the entry
    entries[dir] = targets;
  }

  return entries;
}

/**
 * Add a target to a given array.
 * @param {Array} targets
 * @param {String} dirPath
 * @param {String} file - the file to add as target
 */
function addTarget(targets, dirPath, file) {
  var filePath = path.join(dirPath, file);

  try {
    // Check that the file exists
    fs.lstatSync(filePath).isFile();
  } catch (e) {
    // If file doesn't exist, skip it
    return;
  }

  // If file exists, add it as a target
  targets.push(filePath);
}

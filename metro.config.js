const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Node.js polyfills mapping
const nodePolyfills = {
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer/'),
  process: require.resolve('process/browser'),
  https: require.resolve('https-browserify'),
  http: require.resolve('http-browserify'),
  url: require.resolve('url/'),
  util: require.resolve('util/'),
  assert: require.resolve('assert/'),
  events: require.resolve('events/'),
  zlib: require.resolve('browserify-zlib'),
  // Mock modules that don't have browser equivalents
  net: require.resolve('./src/lib/mocks/net.js'),
  tls: require.resolve('./src/lib/mocks/tls.js'),
  fs: require.resolve('./src/lib/mocks/fs.js'),
  dns: require.resolve('./src/lib/mocks/dns.js'),
  child_process: require.resolve('./src/lib/mocks/child_process.js'),
};

// Add resolver for react-native-web and Node.js polyfills
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native') {
    return {
      filePath: require.resolve('react-native-web'),
      type: 'sourceFile',
    };
  }
  
  // Check if this is a Node.js module that needs polyfilling
  if (nodePolyfills[moduleName]) {
    return {
      filePath: nodePolyfills[moduleName],
      type: 'sourceFile',
    };
  }
  
  // Default behavior
  return context.resolveRequest(context, moduleName, platform);
};

// Add extra node modules for resolution
config.resolver.extraNodeModules = nodePolyfills;

// Ensure the polyfill modules are watched
config.watchFolders = [
  ...(config.watchFolders || []),
  ...Object.values(nodePolyfills).map(polyfill => 
    path.dirname(polyfill).includes('node_modules') 
      ? path.dirname(polyfill) 
      : path.resolve(__dirname)
  ),
];

module.exports = config;
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for react-native-web and crypto polyfills
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native') {
      return {
        filePath: require.resolve('react-native-web'),
        type: 'sourceFile',
      };
    }
    // Add crypto polyfill for web
    if (moduleName === 'crypto') {
      return {
        filePath: require.resolve('crypto-browserify'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'stream') {
      return {
        filePath: require.resolve('stream-browserify'),
        type: 'sourceFile',
      };
    }
  }
  
  // Default behavior
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
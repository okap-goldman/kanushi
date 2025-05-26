const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver for react-native-web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native') {
    return {
      filePath: require.resolve('react-native-web'),
      type: 'sourceFile',
    };
  }
  
  // Default behavior
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
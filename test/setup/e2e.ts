// E2E test setup
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Setup for detox
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock device for E2E tests
global.device = {
  reloadReactNative: jest.fn(),
  disableSynchronization: jest.fn(),
  enableSynchronization: jest.fn(),
  takeScreenshot: jest.fn(),
  setURLBlacklist: jest.fn(),
  launchApp: jest.fn(),
  terminateApp: jest.fn(),
  sendToHome: jest.fn(),
  installApp: jest.fn(),
  uninstallApp: jest.fn(),
  openURL: jest.fn(),
  sleep: jest.fn(),
};
// API test setup
import '@testing-library/jest-native/extend-expect';

// Setup global mocks and configuration for API tests
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
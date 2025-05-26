// UI test setup for Vitest + React Native Testing Library
import { vi, describe, it, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import * as testingLibrary from '../mocks/testing-library-react-native';
import React from 'react';

// Make React available globally
global.React = React;

// Make testing library functions globally available
global.render = testingLibrary.render;
global.fireEvent = testingLibrary.fireEvent;
global.waitFor = testingLibrary.waitFor;
global.act = testingLibrary.act;
global.screen = testingLibrary.screen;

// Make jest available globally for Vitest compatibility
global.jest = vi;

// Make test functions globally available
global.describe = describe;
global.it = it;
global.test = test;
global.expect = expect;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.beforeAll = beforeAll;
global.afterAll = afterAll;

// Add toBeOnTheScreen matcher
expect.extend({
  toBeOnTheScreen(received) {
    const pass = !!received;
    return {
      pass,
      message: () => `expected ${received} to be on the screen`,
    };
  },
});

// Mock necessary modules for UI testing
vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
vi.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock navigation
vi.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    useNavigation: () => ({
      navigate: vi.fn(),
      goBack: vi.fn(),
    }),
    useFocusEffect: vi.fn(),
    NavigationContainer: ({ children }: any) => React.createElement('View', null, children),
    useRoute: () => ({ params: {} }),
    useIsFocused: () => true,
  };
});

// Mock Audio and ImagePicker
vi.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: vi.fn().mockResolvedValue({
        sound: {
          playAsync: vi.fn(),
          pauseAsync: vi.fn(),
          setPositionAsync: vi.fn(),
          getStatusAsync: vi.fn().mockResolvedValue({
            isLoaded: true,
            isPlaying: false,
            positionMillis: 0,
            durationMillis: 180000,
          }),
        },
        status: { isLoaded: true },
      }),
    },
    Recording: {
      createAsync: vi.fn().mockResolvedValue({
        recording: {
          startAsync: vi.fn(),
          stopAndUnloadAsync: vi.fn(),
          getStatusAsync: vi.fn(),
          getURI: vi.fn().mockReturnValue('file://recording.m4a'),
        },
      }),
    },
    requestPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
    setAudioModeAsync: vi.fn(),
    RecordingOptionsPresets: {
      HIGH_QUALITY: {},
    },
  },
  AVPlaybackStatus: {},
}));

vi.mock('expo-image-picker', () => ({
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All',
  },
}));

// Mock Context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => children,
}));

// Mock @expo/vector-icons
vi.mock('@expo/vector-icons', () => ({
  Feather: (props: any) => {
    const { createElement } = require('react');
    return createElement('text', { ...props, testID: props.testID || 'icon' }, props.name);
  },
  AntDesign: (props: any) => {
    const { createElement } = require('react');
    return createElement('text', { ...props, testID: props.testID || 'icon' }, props.name);
  },
  Ionicons: (props: any) => {
    const { createElement } = require('react');
    return createElement('text', { ...props, testID: props.testID || 'icon' }, props.name);
  },
  MaterialIcons: (props: any) => {
    const { createElement } = require('react');
    return createElement('text', { ...props, testID: props.testID || 'icon' }, props.name);
  },
}));

// Mock services
global.userService = {
  getCurrentUser: vi.fn().mockResolvedValue({ id: 'test-user-id', displayName: 'Test User' }),
  getUserById: vi.fn().mockResolvedValue({ id: 'other-user-id', displayName: 'Other User' }),
  updateProfile: vi.fn().mockResolvedValue({ success: true }),
};

global.audioService = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  seek: vi.fn(),
  getStatus: vi.fn().mockResolvedValue({ isPlaying: false, position: 0, duration: 180 }),
};

global.mediaService = {
  uploadFile: vi.fn().mockResolvedValue({ success: true, data: { url: 'https://example.com/file.mp3' }, error: null }),
  processAudio: vi.fn().mockResolvedValue({
    success: true,
    data: {
      originalUrl: 'https://example.com/original.mp3',
      processedUrl: 'https://example.com/processed.mp3',
      waveformUrl: 'https://example.com/waveform.json',
      previewUrl: 'https://example.com/preview.mp3',
      durationSeconds: 180,
    },
    error: null,
  }),
  processImage: vi.fn().mockResolvedValue({
    success: true,
    data: {
      originalUrl: 'https://example.com/original.jpg',
      processedUrl: 'https://example.com/processed.jpg',
      thumbnailUrl: 'https://example.com/thumbnail.jpg',
      width: 800,
      height: 600,
      size: 1024000,
    },
    error: null,
  }),
};

// テスト後のクリーンアップ
afterEach(() => {
  vi.clearAllMocks();
});

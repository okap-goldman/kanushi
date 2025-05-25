// UI test setup for Vitest + React Native Testing Library
import { vi } from 'vitest';
import * as testingLibrary from '../mocks/testing-library-react-native';

// Configure React Native Testing Library
// import 'react-native-gesture-handler/jestSetup';

// Make testing library functions globally available
(global as any).render = testingLibrary.render;
(global as any).fireEvent = testingLibrary.fireEvent;
(global as any).waitFor = testingLibrary.waitFor;
(global as any).act = testingLibrary.act;

// Make jest available globally for Vitest compatibility
(global as any).jest = vi;

// Make test functions globally available
(global as any).describe = describe;
(global as any).it = it;
(global as any).test = test;
(global as any).expect = expect;
(global as any).beforeEach = beforeEach;
(global as any).afterEach = afterEach;
(global as any).beforeAll = beforeAll;
(global as any).afterAll = afterAll;

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

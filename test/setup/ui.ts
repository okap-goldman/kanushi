// UI test setup for Vitest + React Native Testing Library
import { vi } from 'vitest';

// Configure React Native Testing Library
import 'react-native-gesture-handler/jestSetup';

// Mock necessary modules for UI testing
vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
vi.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock navigation
vi.mock('@react-navigation/native', () => {
  return {
    ...vi.importActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: vi.fn(),
      goBack: vi.fn()
    }),
    useFocusEffect: vi.fn(),
    NavigationContainer: ({ children }: any) => children,
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
            durationMillis: 180000
          })
        },
        status: { isLoaded: true }
      })
    },
    Recording: {
      createAsync: vi.fn().mockResolvedValue({
        recording: {
          startAsync: vi.fn(),
          stopAndUnloadAsync: vi.fn(),
          getStatusAsync: vi.fn(),
          getURI: vi.fn().mockReturnValue('file://recording.m4a')
        }
      })
    },
    requestPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
    setAudioModeAsync: vi.fn(),
    RecordingOptionsPresets: {
      HIGH_QUALITY: {}
    }
  },
  AVPlaybackStatus: {}
}));

vi.mock('expo-image-picker', () => ({
  launchCameraAsync: vi.fn(),
  launchImageLibraryAsync: vi.fn(),
  requestCameraPermissionsAsync: vi.fn().mockResolvedValue({ granted: true }),
  MediaTypeOptions: {
    Images: 'Images',
    Videos: 'Videos',
    All: 'All'
  }
}));

// Mock Context
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn()
  }),
  AuthProvider: ({ children }: any) => children
}));
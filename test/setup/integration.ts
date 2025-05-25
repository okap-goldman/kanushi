// Integration test setup
import { vi } from 'vitest';

// Mock necessary modules for integration testing
vi.mock('react-native/Libraries/Animated/NativeAnimatedHelper');
vi.mock('react-native-reanimated', () => ({}));

// Setup test database
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test-anon-key';

// Helper functions for integration tests
export const createTestUser = async (options = {}) => {
  // Implementation would be added here
  return { id: 'test-user-id', ...options };
};

export const createFollowRelation = async (followerId, followeeId, type, reason) => {
  // Implementation would be added here
  return { id: 'test-follow-id', followerId, followeeId, type, reason };
};
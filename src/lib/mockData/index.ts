export * from './users';
export * from './posts';
export * from './messages';
export * from './events';
export * from './liveRooms';
export * from './stories';
export * from './products';
export * from './groups';
export * from './utils';
export * from './timeline';
export * from './interactions';

export interface MockConfig {
  enabled: boolean;
  delay?: number; // 模擬的な遅延（ミリ秒）
}

export const mockConfig: MockConfig = {
  enabled: process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true',
  delay: 300,
};

export const mockDelay = async (customDelay?: number) => {
  if (mockConfig.enabled && (customDelay || mockConfig.delay)) {
    await new Promise(resolve => setTimeout(resolve, customDelay || mockConfig.delay));
  }
};
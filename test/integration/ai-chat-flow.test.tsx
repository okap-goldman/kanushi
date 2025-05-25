import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { Session } from '@supabase/supabase-js';
import { render, waitFor } from '@testing-library/react-native';
import { fireEvent } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';
import { aiChatService } from '../../src/lib/aiChatService';
import { ecService } from '../../src/lib/ecService';
import { eventService } from '../../src/lib/eventService';
import { postService } from '../../src/lib/postService';
import { Search } from '../../src/screens/Search';

const Stack = createNativeStackNavigator();

const mockSession: Session = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
  },
  access_token: 'mock-token',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: 1234567890,
  refresh_token: 'mock-refresh-token',
};

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null,
      }),
    },
    from: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock('../../src/lib/aiChatService');
vi.mock('../../src/lib/postService', () => ({
  postService: {
    getPostsByIds: vi.fn(),
  },
}));
vi.mock('../../src/lib/eventService', () => ({
  eventService: {
    searchEvents: vi.fn(),
  },
}));
vi.mock('../../src/lib/ecService');
vi.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Feather: 'Feather',
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Search" component={Search} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('AI Chat Integration Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Search to AI Chat Flow', () => {
    it('should open AI chat from search screen', async () => {
      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Find and press AI chat button in search bar
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Verify AI chat modal opens
      await waitFor(() => {
        expect(getByText('AIアシスタント')).toBeTruthy();
      });
    });

    it('should search content and display results', async () => {
      const mockSearchResults = {
        posts: [
          {
            id: 'post-1',
            content: '瞑想についての投稿',
            user_id: 'user-456',
            created_at: '2024-01-01T12:00:00Z',
          },
        ],
        events: [
          {
            id: 'event-1',
            title: '瞑想ワークショップ',
            description: '初心者向けの瞑想会',
            start_date: '2024-02-01T10:00:00Z',
          },
        ],
        products: [
          {
            id: 'product-1',
            name: '瞑想音声ガイド',
            description: '30分の瞑想音声',
            price: 1000,
          },
        ],
      };

      vi.mocked(aiChatService.searchContent).mockResolvedValue(mockSearchResults);

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      const searchInput = getByPlaceholderText('検索...（AIに聞く）');

      fireEvent.changeText(searchInput, '瞑想');
      fireEvent(searchInput, 'submitEditing');

      await waitFor(() => {
        expect(getByText('瞑想についての投稿')).toBeTruthy();
        expect(getByText('瞑想ワークショップ')).toBeTruthy();
        expect(getByText('瞑想音声ガイド')).toBeTruthy();
      });
    });
  });

  describe('AI Chat Conversation Flow', () => {
    it('should maintain conversation context', async () => {
      const mockHistory = [
        {
          id: 'msg-1',
          content: '瞑想について教えてください',
          role: 'user' as const,
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'msg-2',
          content: '瞑想は心を静めて集中力を高める実践です。',
          role: 'assistant' as const,
          created_at: '2024-01-01T10:01:00Z',
        },
      ];

      const mockNewResponse = {
        id: 'msg-3',
        content: 'もちろんです。瞑想を始めるには...',
        created_at: '2024-01-01T10:02:00Z',
      };

      vi.mocked(aiChatService.getChatHistory).mockResolvedValue(mockHistory);
      vi.mocked(aiChatService.sendMessage).mockResolvedValue(mockNewResponse);

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Wait for history to load
      await waitFor(() => {
        expect(getByText('瞑想について教えてください')).toBeTruthy();
        expect(getByText('瞑想は心を静めて集中力を高める実践です。')).toBeTruthy();
      });

      // Send follow-up message
      const messageInput = getByPlaceholderText('メッセージを入力...');
      const sendButton = getByTestId('send-message-button');

      fireEvent.changeText(messageInput, '具体的な方法を教えてください');
      fireEvent.press(sendButton);

      await waitFor(() => {
        expect(getByText('もちろんです。瞑想を始めるには...')).toBeTruthy();
      });
    });
  });

  describe('Content Discovery through AI', () => {
    it('should recommend content based on user preferences', async () => {
      const mockRecommendations = {
        posts: ['post-1', 'post-2', 'post-3'],
        users: ['user-456', 'user-789'],
        events: ['event-1'],
      };

      const mockPosts = [
        {
          id: 'post-1',
          content: 'おすすめの瞑想法',
          user_id: 'user-456',
          created_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'post-2',
          content: 'マインドフルネスの実践',
          user_id: 'user-789',
          created_at: '2024-01-01T11:00:00Z',
        },
      ];

      vi.mocked(aiChatService.getRecommendations).mockResolvedValue(mockRecommendations);
      vi.mocked(postService.getPostsByIds).mockResolvedValue(mockPosts);

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Get recommendations
      await waitFor(() => {
        const recommendationsButton = getByTestId('recommendations-button');
        fireEvent.press(recommendationsButton);
      });

      await waitFor(() => {
        expect(getByText('投稿: 3件')).toBeTruthy();
        expect(getByText('ユーザー: 2人')).toBeTruthy();
        expect(getByText('イベント: 1件')).toBeTruthy();
      });
    });
  });

  describe('Quick Actions Integration', () => {
    it('should handle event search quick action', async () => {
      const mockEvents = [
        {
          id: 'event-1',
          title: 'スピリチュアル音楽会',
          description: '癒しの音楽イベント',
          start_date: '2024-02-15T18:00:00Z',
          location: '東京',
        },
      ];

      vi.mocked(aiChatService.sendMessage).mockResolvedValue({
        id: 'msg-1',
        content: 'こちらがおすすめのイベントです。',
        created_at: new Date().toISOString(),
      });

      vi.mocked(eventService.searchEvents).mockResolvedValue(mockEvents);

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Click quick action
      await waitFor(() => {
        const quickAction = getByText('イベントを探す');
        fireEvent.press(quickAction);
      });

      await waitFor(() => {
        expect(aiChatService.sendMessage).toHaveBeenCalledWith('イベントを探したいです');
        expect(getByText('こちらがおすすめのイベントです。')).toBeTruthy();
      });
    });

    it('should handle post recommendations quick action', async () => {
      const mockResponse = {
        id: 'msg-2',
        content: 'あなたにおすすめの投稿をご紹介します。',
        created_at: new Date().toISOString(),
      };

      vi.mocked(aiChatService.sendMessage).mockResolvedValue(mockResponse);

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Click quick action
      await waitFor(() => {
        const quickAction = getByText('おすすめの投稿');
        fireEvent.press(quickAction);
      });

      await waitFor(() => {
        expect(aiChatService.sendMessage).toHaveBeenCalledWith('おすすめの投稿を教えてください');
        expect(getByText('あなたにおすすめの投稿をご紹介します。')).toBeTruthy();
      });
    });
  });

  describe('Error Handling in Integration', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(aiChatService.searchContent).mockRejectedValue(new Error('Network error'));

      const { getByPlaceholderText, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      const searchInput = getByPlaceholderText('検索...（AIに聞く）');

      fireEvent.changeText(searchInput, 'テスト');
      fireEvent(searchInput, 'submitEditing');

      await waitFor(() => {
        expect(getByText('検索に失敗しました')).toBeTruthy();
      });
    });

    it('should handle AI service errors', async () => {
      vi.mocked(aiChatService.sendMessage).mockRejectedValue(new Error('AI service unavailable'));

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Send message
      await waitFor(() => {
        const messageInput = getByPlaceholderText('メッセージを入力...');
        const sendButton = getByTestId('send-message-button');

        fireEvent.changeText(messageInput, 'テストメッセージ');
        fireEvent.press(sendButton);
      });

      await waitFor(() => {
        expect(getByText('メッセージの送信に失敗しました')).toBeTruthy();
      });
    });
  });

  describe('Session Management', () => {
    it('should clear chat history', async () => {
      vi.mocked(aiChatService.clearChatHistory).mockResolvedValue(undefined);

      const { getByTestId, getByText } = render(
        <TestWrapper>
          <Search />
        </TestWrapper>
      );

      // Open AI chat
      const aiChatButton = getByTestId('ai-chat-button');
      fireEvent.press(aiChatButton);

      // Clear chat
      await waitFor(() => {
        const clearButton = getByTestId('clear-chat-button');
        fireEvent.press(clearButton);
      });

      await waitFor(() => {
        expect(aiChatService.clearChatHistory).toHaveBeenCalled();
        expect(getByText('履歴をクリアしました')).toBeTruthy();
      });
    });
  });
});

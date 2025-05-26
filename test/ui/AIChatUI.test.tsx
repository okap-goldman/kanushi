import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { vi } from 'vitest';
import { AIChat } from '../../src/components/ai/AIChat';
import { aiChatService } from '../../src/lib/aiChatService';

vi.mock('../../src/lib/aiChatService', () => ({
  aiChatService: {
    sendMessage: vi.fn(),
    getChatHistory: vi.fn(),
    clearChatHistory: vi.fn(),
    getRecommendations: vi.fn(),
  },
}));

vi.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AIChat', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render chat interface', () => {
    const { getByText, getByPlaceholderText } = render(
      <AIChat isVisible={true} onClose={mockOnClose} />
    );

    expect(getByText('AIアシスタント')).toBeTruthy();
    expect(getByPlaceholderText('メッセージを入力...')).toBeTruthy();
  });

  it('should load chat history on mount', async () => {
    const mockHistory = [
      {
        id: 'msg-1',
        content: 'こんにちは',
        role: 'user' as const,
        created_at: '2024-01-01T10:00:00Z',
      },
      {
        id: 'msg-2',
        content: 'こんにちは！何かお手伝いできることはありますか？',
        role: 'assistant' as const,
        created_at: '2024-01-01T10:01:00Z',
      },
    ];

    vi.mocked(aiChatService.getChatHistory).mockResolvedValue(mockHistory);

    const { getByText } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(getByText('こんにちは')).toBeTruthy();
      expect(getByText('こんにちは！何かお手伝いできることはありますか？')).toBeTruthy();
    });
  });

  it('should send message when send button is pressed', async () => {
    const mockResponse = {
      id: 'msg-3',
      content: 'はい、お答えします。',
      created_at: new Date().toISOString(),
    };

    vi.mocked(aiChatService.sendMessage).mockResolvedValue(mockResponse);

    const { getByPlaceholderText, getByTestId } = render(
      <AIChat isVisible={true} onClose={mockOnClose} />
    );

    const messageInput = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-message-button');

    fireEvent.changeText(messageInput, '質問があります');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(aiChatService.sendMessage).toHaveBeenCalledWith('質問があります');
    });
  });

  it('should show loading state while sending message', async () => {
    vi.mocked(aiChatService.sendMessage).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByPlaceholderText, getByTestId } = render(
      <AIChat isVisible={true} onClose={mockOnClose} />
    );

    const messageInput = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-message-button');

    fireEvent.changeText(messageInput, '質問');
    fireEvent.press(sendButton);

    expect(getByTestId('message-loading')).toBeTruthy();
  });

  it('should not send empty messages', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <AIChat isVisible={true} onClose={mockOnClose} />
    );

    const messageInput = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-message-button');

    fireEvent.changeText(messageInput, '');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(aiChatService.sendMessage).not.toHaveBeenCalled();
    });
  });

  it('should clear chat history when clear button is pressed', async () => {
    vi.mocked(aiChatService.clearChatHistory).mockResolvedValue(undefined);

    const { getByTestId } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    const clearButton = getByTestId('clear-chat-button');
    fireEvent.press(clearButton);

    await waitFor(() => {
      expect(aiChatService.clearChatHistory).toHaveBeenCalled();
    });
  });

  it('should show quick actions', () => {
    const { getByText } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    expect(getByText('イベントを探す')).toBeTruthy();
    expect(getByText('おすすめの投稿')).toBeTruthy();
    expect(getByText('使い方を教えて')).toBeTruthy();
  });

  it('should handle quick action press', async () => {
    const mockResponse = {
      id: 'msg-4',
      content: 'おすすめの投稿をご紹介します。',
      created_at: new Date().toISOString(),
    };

    vi.mocked(aiChatService.sendMessage).mockResolvedValue(mockResponse);

    const { getByText } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    const quickAction = getByText('おすすめの投稿');
    fireEvent.press(quickAction);

    await waitFor(() => {
      expect(aiChatService.sendMessage).toHaveBeenCalledWith('おすすめの投稿を教えてください');
    });
  });

  it('should show recommendations', async () => {
    const mockRecommendations = {
      posts: ['post-1', 'post-2'],
      users: ['user-1'],
      events: ['event-1'],
    };

    vi.mocked(aiChatService.getRecommendations).mockResolvedValue(mockRecommendations);

    const { getByTestId } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    const recommendationsButton = getByTestId('recommendations-button');
    fireEvent.press(recommendationsButton);

    await waitFor(() => {
      expect(getByTestId('recommendations-view')).toBeTruthy();
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Network error');
    vi.mocked(aiChatService.sendMessage).mockRejectedValue(mockError);

    const mockToast = vi.fn();
    vi.mock('../../src/hooks/use-toast', () => ({
      useToast: () => ({ toast: mockToast }),
    }));

    const { getByPlaceholderText, getByTestId } = render(
      <AIChat isVisible={true} onClose={mockOnClose} />
    );

    const messageInput = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-message-button');

    fireEvent.changeText(messageInput, '質問');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(aiChatService.sendMessage).toHaveBeenCalled();
    });
  });

  it('should close when close button is pressed', () => {
    const { getByTestId } = render(<AIChat isVisible={true} onClose={mockOnClose} />);

    const closeButton = getByTestId('close-button');
    fireEvent.press(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should not render when not visible', () => {
    const { queryByText } = render(<AIChat isVisible={false} onClose={mockOnClose} />);

    expect(queryByText('AIアシスタント')).toBeNull();
  });
});

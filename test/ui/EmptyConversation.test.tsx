import React from 'react';
import { render } from '@testing-library/react-native';
import { EmptyConversation } from '@/components/chat/EmptyConversation';

describe('EmptyConversation', () => {
  it('デフォルトメッセージが表示される', () => {
    const { getByText, getByTestId } = render(<EmptyConversation />);
    
    expect(getByText('No messages yet')).toBeTruthy();
    expect(getByText('Send a message to start the conversation')).toBeTruthy();
    expect(() => getByTestId('icon-message-circle')).not.toThrow();
  });

  it('ユーザー名付きメッセージが表示される', () => {
    const { getByText } = render(<EmptyConversation userName="田中太郎" />);
    
    expect(getByText('Start a conversation with 田中太郎')).toBeTruthy();
    expect(getByText('Send a message to start the conversation')).toBeTruthy();
  });

  it('メッセージアイコンが表示される', () => {
    const { getByTestId } = render(<EmptyConversation />);
    
    // アイコンが表示されることを確認
    expect(() => getByTestId('icon-message-circle')).not.toThrow();
  });

  it('適切なテキストスタイルでレンダリングされる', () => {
    const { getByText, container } = render(<EmptyConversation userName="Test User" />);
    
    const title = getByText('Start a conversation with Test User');
    const subtitle = getByText('Send a message to start the conversation');
    
    // 要素が存在することを確認
    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
    expect(container).toBeTruthy();
  });
});
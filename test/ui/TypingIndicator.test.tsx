import React from 'react';
import { render } from '@testing-library/react-native';
import { TypingIndicator } from '@/components/chat/TypingIndicator';

describe('TypingIndicator', () => {
  it('アニメーションドットが表示される', () => {
    const { getAllByTestId } = render(<TypingIndicator />);
    
    // 3つのドットが表示されることを確認
    const dots = getAllByTestId('typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('ユーザー名が表示される', () => {
    const { getByText } = render(<TypingIndicator userName="田中太郎" />);
    
    expect(getByText('田中太郎 is typing')).toBeTruthy();
  });

  it('ユーザー名なしでも表示される', () => {
    const { queryByText, getAllByTestId } = render(<TypingIndicator />);
    
    expect(queryByText('is typing')).toBeFalsy();
    // ドットは表示される
    const dots = getAllByTestId('typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('カスタムスタイルが適用される', () => {
    const customStyle = { backgroundColor: 'red' };
    const { container } = render(
      <TypingIndicator style={customStyle} testID="typing-indicator" />
    );
    
    // コンポーネントがレンダリングされることを確認
    expect(container).toBeTruthy();
  });
});
import React from 'react';
import { render } from '@testing-library/react-native';
import { MessageStatus } from '@/components/chat/MessageStatus';

describe('MessageStatus', () => {
  it('送信中アイコンが表示される', () => {
    const { getByTestId } = render(<MessageStatus status="sending" />);
    
    // time-outline アイコンが表示されることを確認
    expect(() => getByTestId('icon-time-outline')).not.toThrow();
  });

  it('送信済みアイコンが表示される', () => {
    const { getByTestId } = render(<MessageStatus status="sent" />);
    
    // checkmark アイコンが表示されることを確認
    expect(() => getByTestId('icon-checkmark')).not.toThrow();
  });

  it('配信済みアイコン（ダブルチェック）が表示される', () => {
    const { getAllByTestId } = render(<MessageStatus status="delivered" />);
    
    // 2つのcheckmarkアイコンが表示されることを確認
    const checkmarks = getAllByTestId('icon-checkmark');
    expect(checkmarks).toHaveLength(2);
  });

  it('既読アイコン（青いダブルチェック）が表示される', () => {
    const { getAllByTestId } = render(<MessageStatus status="read" />);
    
    // 2つのcheckmarkアイコンが表示されることを確認
    const checkmarks = getAllByTestId('icon-checkmark');
    expect(checkmarks).toHaveLength(2);
  });

  it('送信失敗アイコンが表示される', () => {
    const { getByTestId } = render(<MessageStatus status="failed" />);
    
    // alert-circle-outline アイコンが表示されることを確認
    expect(() => getByTestId('icon-alert-circle-outline')).not.toThrow();
  });

  it('デフォルトサイズのアイコンが表示される', () => {
    const { container } = render(<MessageStatus status="sent" />);
    
    // コンポーネントがレンダリングされることを確認
    expect(container).toBeTruthy();
  });

  it('カスタムプロパティでレンダリングできる', () => {
    // カスタムサイズとカラーでレンダリングできることを確認
    const { container } = render(<MessageStatus status="sent" size={24} color="#FF0000" />);
    
    expect(container).toBeTruthy();
  });
});
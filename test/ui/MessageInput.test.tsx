import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/View', () => 'View');
jest.mock('@/components/ui/TextInput', () => 'TextInput');
jest.mock('@/components/ui/TouchableOpacity', () => 'TouchableOpacity');
jest.mock('@/components/ui/Icon', () => 'Icon');
jest.mock('@/components/ui/ActivityIndicator', () => 'ActivityIndicator');
jest.mock('@/components/ui/Image', () => 'Image');

// Mock image picker
const mockImagePicker = {
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{
      uri: 'file:///path/to/image.jpg',
      width: 300,
      height: 400,
      type: 'image'
    }]
  })
};

jest.mock('expo-image-picker', () => mockImagePicker);

import MessageInput from '@/components/MessageInput';

describe('MessageInput Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('メッセージ入力と送信', async () => {
    // Given
    const mockOnSend = jest.fn();
    const props = {
      onSend: mockOnSend,
      placeholder: 'メッセージを入力',
      disabled: false
    };

    // When
    render(<MessageInput {...props} />);
    
    // テキストを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        'テストメッセージ'
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(mockOnSend).toHaveBeenCalledWith({
      content: 'テストメッセージ',
      image: null
    });
    
    // 入力フィールドがクリアされることを確認
    expect(screen.getByPlaceholderText('メッセージを入力')).toHaveProp('value', '');
  });

  test('空のメッセージ送信防止', async () => {
    // Given
    const mockOnSend = jest.fn();
    const props = {
      onSend: mockOnSend,
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // 空の状態で送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    expect(mockOnSend).not.toHaveBeenCalled();
  });

  test('無効状態の表示', async () => {
    // Given
    const props = {
      onSend: jest.fn(),
      placeholder: 'メッセージを入力',
      disabled: true
    };

    // When
    render(<MessageInput {...props} />);
    
    // Then
    expect(screen.getByPlaceholderText('メッセージを入力')).toBeDisabled();
    expect(screen.getByTestId('send-button')).toBeDisabled();
  });

  test('画像選択と表示', async () => {
    // Given
    const mockOnSend = jest.fn();
    const props = {
      onSend: mockOnSend,
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // 画像添付ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('attach-image-button'));
    });
    
    // Then
    // 選択した画像が表示されることを確認
    expect(screen.getByTestId('selected-image')).toHaveProp('source', {
      uri: 'file:///path/to/image.jpg'
    });
    
    // メッセージを入力して送信
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        '画像付きメッセージ'
      );
    });
    
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // 画像が含まれたメッセージが送信されることを確認
    expect(mockOnSend).toHaveBeenCalledWith({
      content: '画像付きメッセージ',
      image: {
        uri: 'file:///path/to/image.jpg',
        width: 300,
        height: 400,
        type: 'image'
      }
    });
    
    // 画像選択がリセットされることを確認
    expect(screen.queryByTestId('selected-image')).toBeNull();
  });

  test('画像選択のキャンセル', async () => {
    // Given
    mockImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: true
    });
    
    const props = {
      onSend: jest.fn(),
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // 画像添付ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('attach-image-button'));
    });
    
    // Then
    // 画像が選択されないことを確認
    expect(screen.queryByTestId('selected-image')).toBeNull();
  });

  test('選択済み画像のキャンセル', async () => {
    // Given
    const props = {
      onSend: jest.fn(),
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // 画像を選択
    await act(() => {
      fireEvent.press(screen.getByTestId('attach-image-button'));
    });
    
    // 画像が表示されることを確認
    expect(screen.getByTestId('selected-image')).toBeTruthy();
    
    // 画像キャンセルボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('cancel-image-button'));
    });
    
    // Then
    // 画像選択がキャンセルされることを確認
    expect(screen.queryByTestId('selected-image')).toBeNull();
  });

  test('送信中の状態表示', async () => {
    // Given
    // 送信に時間がかかる処理をシミュレート
    const mockOnSend = jest.fn().mockImplementation(() => {
      return new Promise(resolve => {
        setTimeout(resolve, 1000);
      });
    });
    
    const props = {
      onSend: mockOnSend,
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // テキストを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        'テストメッセージ'
      );
    });
    
    // 送信ボタンをタップ
    await act(() => {
      fireEvent.press(screen.getByTestId('send-button'));
    });
    
    // Then
    // ローディングインジケータが表示されることを確認
    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    
    // 入力フィールドが無効化されることを確認
    expect(screen.getByPlaceholderText('メッセージを入力')).toBeDisabled();
  });

  test('テキスト入力サイズの自動調整', async () => {
    // Given
    const props = {
      onSend: jest.fn(),
      placeholder: 'メッセージを入力'
    };

    // When
    render(<MessageInput {...props} />);
    
    // 短いテキストを入力
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        '短いテキスト'
      );
    });
    
    // 初期高さを記録
    const initialHeight = screen.getByTestId('input-container').props.style.height;
    
    // 長いテキストを入力（複数行）
    const longText = 'これは長いテキストメッセージです。\n複数行に渡るメッセージをシミュレートしています。\nテキスト入力のサイズが自動的に調整されるかテストします。';
    
    await act(() => {
      fireEvent.changeText(
        screen.getByPlaceholderText('メッセージを入力'),
        longText
      );
    });
    
    // TextInputのcontentSizeChangeイベントをシミュレート
    await act(() => {
      fireEvent(
        screen.getByPlaceholderText('メッセージを入力'),
        'contentSizeChange',
        { nativeEvent: { contentSize: { width: 100, height: 80 } } }
      );
    });
    
    // Then
    // 入力コンテナの高さが増加していることを確認
    expect(screen.getByTestId('input-container').props.style.height).toBeGreaterThan(initialHeight);
  });
});
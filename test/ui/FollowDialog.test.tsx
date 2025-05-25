import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';

// Mock components
jest.mock('@/components/ui/Dialog', () => 'Dialog');
jest.mock('@/components/ui/TextInput', () => 'TextInput');
jest.mock('@/components/ui/Button', () => 'Button');
jest.mock('@/components/ui/Text', () => 'Text');

import FollowReasonDialog from '@/components/FollowReasonDialog';

describe('FollowReasonDialog Component', () => {
  test('should render family follow reason input dialog', () => {
    // Given
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: jest.fn(),
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);

    // Then
    expect(screen.getByText('ファミリーフォローの理由')).toBeOnTheScreen();
    expect(screen.getByPlaceholderText('フォローする理由を入力してください'))
      .toBeOnTheScreen();
    expect(screen.getByText('フォロー')).toBeDisabled(); // 初期状態では無効
  });

  test('should enable submit button when reason is entered', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    const reasonInput = screen.getByPlaceholderText('フォローする理由を入力してください');
    
    await act(() => {
      fireEvent.changeText(reasonInput, '同じ価値観を持つ方だと感じたため');
    });

    // Then
    expect(screen.getByText('フォロー')).not.toBeDisabled();
  });

  test('should submit family follow with reason', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'family',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    const reasonInput = screen.getByPlaceholderText('フォローする理由を入力してください');
    
    await act(() => {
      fireEvent.changeText(reasonInput, 'テスト理由');
    });
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    expect(mockOnSubmit).toHaveBeenCalledWith({
      followType: 'family',
      followReason: 'テスト理由'
    });
  });
});

describe('WatchFollowDialog Component', () => {
  test('should immediately execute watch follow', async () => {
    // Given
    const mockOnSubmit = jest.fn();
    const props = {
      visible: true,
      followType: 'watch',
      onSubmit: mockOnSubmit,
      onCancel: jest.fn()
    };

    // When
    render(<FollowReasonDialog {...props} />);
    
    await act(() => {
      fireEvent.press(screen.getByText('フォロー'));
    });

    // Then
    expect(mockOnSubmit).toHaveBeenCalledWith({
      followType: 'watch',
      followReason: null
    });
  });
});
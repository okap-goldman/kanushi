import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';

describe('DeleteConfirmDialog Component', () => {
  it('削除確認メッセージが表示される', () => {
    // Arrange & Act
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={jest.fn()} onCancel={jest.fn()} />
    );

    // Assert
    expect(getByText('投稿を削除しますか？')).toBeTruthy();
    expect(getByText('この操作は取り消せません。')).toBeTruthy();
  });

  it('削除ボタンでonConfirmが呼ばれる', () => {
    // Arrange
    const onConfirm = jest.fn();
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={onConfirm} onCancel={jest.fn()} />
    );

    // Act
    fireEvent.press(getByText('削除'));

    // Assert
    expect(onConfirm).toHaveBeenCalled();
  });

  it('キャンセルボタンでonCancelが呼ばれる', () => {
    // Arrange
    const onCancel = jest.fn();
    const { getByText } = render(
      <DeleteConfirmDialog visible={true} onConfirm={jest.fn()} onCancel={onCancel} />
    );

    // Act
    fireEvent.press(getByText('キャンセル'));

    // Assert
    expect(onCancel).toHaveBeenCalled();
  });
});

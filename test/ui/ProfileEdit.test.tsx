// src/screens/__tests__/ProfileEdit.test.tsx
import React from 'react';

// ProfileEditコンポーネントのモック
const ProfileEdit = () => {
  return <div data-testid="profile-edit-component"></div>;
};

describe('ProfileEdit Screen', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    vi.clearAllMocks();
  });

  it('現在のプロフィール情報で初期化される', async () => {
    // Given
    const mockUser = { id: 'user123', displayName: 'テストユーザー', profileText: '自己紹介文です' };
    userService.getCurrentUser.mockResolvedValue(mockUser);

    // When
    render(<ProfileEdit />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('display-name-input').props.value).toBe('テストユーザー');
      expect(screen.getByTestId('profile-text-input').props.value).toBe('自己紹介文です');
    });
  });

  it('入力フィールドの変更が正しく反映される', async () => {
    // Given
    render(<ProfileEdit />);

    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    const profileTextInput = await screen.findByTestId('profile-text-input');

    fireEvent.changeText(displayNameInput, '新しい名前');
    fireEvent.changeText(profileTextInput, '新しい自己紹介');

    // Then
    expect(displayNameInput.props.value).toBe('新しい名前');
    expect(profileTextInput.props.value).toBe('新しい自己紹介');
  });

  it('保存ボタンタップでプロフィール更新が実行される', async () => {
    // Given
    const mockUpdateProfile = vi.fn().mockResolvedValue({ success: true });
    userService.updateProfile.mockImplementation(mockUpdateProfile);

    render(<ProfileEdit />);

    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    const profileTextInput = await screen.findByTestId('profile-text-input');
    const saveButton = await screen.findByTestId('save-button');

    fireEvent.changeText(displayNameInput, '新しい名前');
    fireEvent.changeText(profileTextInput, '新しい自己紹介');
    fireEvent.press(saveButton);

    // Then
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        displayName: '新しい名前',
        profileText: '新しい自己紹介',
      });
    });
  });

  it('バリデーションエラー時にエラーメッセージが表示される', async () => {
    // Given
    const mockUpdateProfile = vi.fn().mockResolvedValue({ success: false, error: new Error('更新に失敗しました') });
    userService.updateProfile.mockImplementation(mockUpdateProfile);

    render(<ProfileEdit />);

    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    const saveButton = await screen.findByTestId('save-button');

    fireEvent.changeText(displayNameInput, '');
    fireEvent.press(saveButton);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeOnTheScreen();
      expect(screen.getByText('表示名は必須です')).toBeOnTheScreen();
    });
  });
});

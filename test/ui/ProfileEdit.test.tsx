// src/screens/__tests__/ProfileEdit.test.tsx
describe('ProfileEdit Screen', () => {
  it('現在のプロフィール情報で初期化される', async () => {
    // Given
    const currentProfile = {
      displayName: '現在の名前',
      profileText: '現在の自己紹介',
      prefecture: '東京都',
      city: '渋谷区'
    };
    jest.spyOn(userService, 'getCurrentUser').mockResolvedValue(currentProfile);

    // When
    render(<ProfileEdit />);

    // Then
    await waitFor(() => {
      expect(screen.getByDisplayValue('現在の名前')).toBeOnTheScreen();
      expect(screen.getByDisplayValue('現在の自己紹介')).toBeOnTheScreen();
    });
  });

  it('入力フィールドの変更が正しく反映される', async () => {
    // Given
    render(<ProfileEdit />);
    
    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, '新しい名前');

    // Then
    expect(screen.getByDisplayValue('新しい名前')).toBeOnTheScreen();
  });

  it('保存ボタンタップでプロフィール更新が実行される', async () => {
    // Given
    const mockUpdateProfile = jest.fn().mockResolvedValue({});
    jest.spyOn(userService, 'updateProfile').mockImplementation(mockUpdateProfile);

    render(<ProfileEdit />);
    
    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, '更新された名前');
    
    const saveButton = screen.getByText('保存');
    fireEvent.press(saveButton);

    // Then
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        displayName: '更新された名前'
      });
    });
  });

  it('バリデーションエラー時にエラーメッセージが表示される', async () => {
    // Given
    const mockUpdateProfile = jest.fn().mockRejectedValue({
      errors: [{ field: 'displayName', message: '表示名は必須です' }]
    });
    jest.spyOn(userService, 'updateProfile').mockImplementation(mockUpdateProfile);

    render(<ProfileEdit />);
    
    // When
    const displayNameInput = await screen.findByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, '');
    
    const saveButton = screen.getByText('保存');
    fireEvent.press(saveButton);

    // Then
    await waitFor(() => {
      expect(screen.getByText('表示名は必須です')).toBeOnTheScreen();
    });
  });
});
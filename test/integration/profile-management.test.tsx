describe('Profile Management Integration', () => {
  beforeEach(async () => {
    await setupAuthenticatedUser();
  });

  it('プロフィール編集から保存まで', async () => {
    // Given
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <ProfileStack />
      </NavigationContainer>
    );

    // When - プロフィール画面から編集画面へ
    const editButton = getByTestId('edit-profile-button');
    fireEvent.press(editButton);

    // Then - 編集画面が表示される
    await waitFor(() => {
      expect(getByText('プロフィール編集')).toBeOnTheScreen();
    });

    // When - 各フィールドを更新
    const displayNameInput = getByTestId('display-name-input');
    const profileTextInput = getByTestId('profile-text-input');

    fireEvent.changeText(displayNameInput, '更新されたユーザー名');
    fireEvent.changeText(profileTextInput, '更新された自己紹介文');

    // When - 保存実行
    const saveButton = getByText('保存');
    fireEvent.press(saveButton);

    // Then - プロフィール画面に戻る
    await waitFor(() => {
      expect(getByText('更新されたユーザー名')).toBeOnTheScreen();
      expect(getByText('更新された自己紹介文')).toBeOnTheScreen();
    });

    // Then - データベースが更新されている
    const updatedUser = await userService.getCurrentUser();
    expect(updatedUser.displayName).toBe('更新されたユーザー名');
    expect(updatedUser.profileText).toBe('更新された自己紹介文');
  });

  it('プロフィール画像アップロード', async () => {
    // Given
    const { getByTestId } = render(<ProfileEdit />);
    const mockImageUri = 'file://path/to/image.jpg';

    // When - 画像選択
    const imageButton = getByTestId('profile-image-button');
    fireEvent.press(imageButton);

    // Mock画像ピッカーからの戻り値
    fireEvent(imageButton, 'onImageSelected', { uri: mockImageUri });

    // When - 保存
    const saveButton = getByTestId('save-button');
    fireEvent.press(saveButton);

    // Then - 画像アップロードが完了している
    await waitFor(async () => {
      const user = await userService.getCurrentUser();
      expect(user.profileImageUrl).toMatch(/^https:\/\/cdn\.kanushi\.tld\/.+$/);
    });
  });
});

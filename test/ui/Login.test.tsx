// src/screens/__tests__/Login.test.tsx
describe('Login Screen', () => {
  it('ログイン画面が正しくレンダリングされる', () => {
    // Given & When
    render(<Login />);

    // Then
    expect(screen.getByText('Googleアカウント連携')).toBeOnTheScreen();
    expect(screen.getByText('Appleアカウント連携')).toBeOnTheScreen();
    expect(screen.getByText('Email + Passkey')).toBeOnTheScreen();
  });

  it('Googleログインボタンタップで認証が開始される', async () => {
    // Given
    const mockSignInWithGoogle = jest.fn().mockResolvedValue({
      user: mockUser,
      accessToken: 'token'
    });
    jest.spyOn(authService, 'signInWithGoogle').mockImplementation(mockSignInWithGoogle);

    render(<Login />);

    // When
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    await waitFor(() => {
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });
  });

  it('認証中はローディング状態が表示される', async () => {
    // Given
    const mockSignInWithGoogle = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    jest.spyOn(authService, 'signInWithGoogle').mockImplementation(mockSignInWithGoogle);

    render(<Login />);

    // When
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen();
    expect(googleButton).toBeDisabled();
  });

  it('認証エラー時にエラーメッセージが表示される', async () => {
    // Given
    const mockSignInWithGoogle = jest.fn().mockRejectedValue(
      new Error('INVALID_TOKEN')
    );
    jest.spyOn(authService, 'signInWithGoogle').mockImplementation(mockSignInWithGoogle);

    render(<Login />);

    // When
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    await waitFor(() => {
      expect(screen.getByText('認証に失敗しました。もう一度お試しください。')).toBeOnTheScreen();
    });
  });

  it('ネットワークエラー時に適切なメッセージが表示される', async () => {
    // Given
    const mockSignInWithGoogle = jest.fn().mockRejectedValue(
      new Error('NETWORK_ERROR')
    );
    jest.spyOn(authService, 'signInWithGoogle').mockImplementation(mockSignInWithGoogle);

    render(<Login />);

    // When
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    await waitFor(() => {
      expect(screen.getByText('ネットワークエラーが発生しました。接続を確認してください。')).toBeOnTheScreen();
    });
  });
});
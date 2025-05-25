// src/screens/__tests__/Profile.test.tsx
describe('Profile Screen', () => {
  it('自分のプロフィールが正しく表示される', async () => {
    // Given
    const mockUser = {
      id: 'user123',
      displayName: 'テストユーザー',
      profileText: '自己紹介文です',
      profileImageUrl: 'https://example.com/image.jpg',
      introAudioUrl: 'https://example.com/audio.mp3',
    };
    jest.spyOn(userService, 'getCurrentUser').mockResolvedValue(mockUser);

    // When
    render(<Profile userId="user123" />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('テストユーザー')).toBeOnTheScreen();
      expect(screen.getByText('自己紹介文です')).toBeOnTheScreen();
      expect(screen.getByTestId('profile-image')).toBeOnTheScreen();
      expect(screen.getByTestId('intro-audio-player')).toBeOnTheScreen();
    });
  });

  it('他人のプロフィールでフォローボタンが表示される', async () => {
    // Given
    const otherUser = {
      id: 'other123',
      displayName: '他のユーザー',
    };
    jest.spyOn(userService, 'getUserById').mockResolvedValue(otherUser);

    // When
    render(<Profile userId="other123" />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('follow-button')).toBeOnTheScreen();
      expect(screen.getByText('フォロー')).toBeOnTheScreen();
    });
  });

  it('自分のプロフィールで編集ボタンが表示される', async () => {
    // Given
    const currentUser = { id: 'current123', displayName: '現在のユーザー' };
    jest.spyOn(userService, 'getCurrentUser').mockResolvedValue(currentUser);

    // When
    render(<Profile userId="current123" />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-button')).toBeOnTheScreen();
    });
  });

  it('音声再生ボタンタップで音声が再生される', async () => {
    // Given
    const mockPlayAudio = jest.fn();
    jest.spyOn(audioService, 'play').mockImplementation(mockPlayAudio);

    render(<Profile userId="user123" />);

    // When
    const playButton = await screen.findByTestId('audio-play-button');
    fireEvent.press(playButton);

    // Then
    expect(mockPlayAudio).toHaveBeenCalledWith('https://example.com/audio.mp3');
  });
});

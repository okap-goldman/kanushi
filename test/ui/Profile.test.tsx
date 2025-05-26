// src/screens/__tests__/Profile.test.tsx
import React from 'react';

// Profileコンポーネントのモック
const Profile = ({ userId }) => {
  return <div data-testid="profile-component">{userId}</div>;
};

describe('Profile Screen', () => {
  beforeEach(() => {
    // テスト前にモックをリセット
    vi.clearAllMocks();
  });

  it('自分のプロフィールが正しく表示される', async () => {
    // Given
    const mockUser = {
      id: 'user123',
      displayName: 'テストユーザー',
      profileText: '自己紹介文です',
      profileImageUrl: 'https://example.com/image.jpg',
      introAudioUrl: 'https://example.com/audio.mp3',
    };
    userService.getCurrentUser.mockResolvedValue(mockUser);
    userService.getUserById.mockResolvedValue(mockUser);

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
    const currentUser = { id: 'current123', displayName: '現在のユーザー' };
    userService.getUserById.mockResolvedValue(otherUser);
    userService.getCurrentUser.mockResolvedValue(currentUser);

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
    userService.getCurrentUser.mockResolvedValue(currentUser);
    userService.getUserById.mockResolvedValue(currentUser);

    // When
    render(<Profile userId="current123" />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('edit-profile-button')).toBeOnTheScreen();
    });
  });

  it('音声再生ボタンタップで音声が再生される', async () => {
    // Given
    const mockUser = {
      id: 'user123',
      displayName: 'テストユーザー',
      introAudioUrl: 'https://example.com/audio.mp3',
    };
    userService.getUserById.mockResolvedValue(mockUser);
    
    const mockPlayAudio = vi.fn();
    audioService.play.mockImplementation(mockPlayAudio);

    render(<Profile userId="user123" />);

    // When
    await waitFor(() => {
      expect(screen.getByTestId('audio-play-button')).toBeOnTheScreen();
    });
    
    const playButton = screen.getByTestId('audio-play-button');
    fireEvent.press(playButton);

    // Then
    expect(mockPlayAudio).toHaveBeenCalledWith('https://example.com/audio.mp3');
  });
});

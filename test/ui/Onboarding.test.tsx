// src/screens/__tests__/Onboarding.test.tsx
describe('Onboarding Screens', () => {
  describe('ProfileSetup', () => {
    it('表示名入力画面が正しく表示される', () => {
      // Given & When
      render(<ProfileSetup step="displayName" />);

      // Then
      expect(screen.getByText('表示名を入力してください')).toBeOnTheScreen();
      expect(screen.getByTestId('display-name-input')).toBeOnTheScreen();
      expect(screen.getByText('次へ')).toBeDisabled();
    });

    it('表示名入力で次へボタンが有効になる', async () => {
      // Given
      render(<ProfileSetup step="displayName" />);
      const input = screen.getByTestId('display-name-input');
      const nextButton = screen.getByText('次へ');

      // When
      fireEvent.changeText(input, 'テストユーザー');

      // Then
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('表示名が空の場合、次へボタンが無効のまま', () => {
      // Given
      render(<ProfileSetup step="displayName" />);
      const input = screen.getByTestId('display-name-input');
      const nextButton = screen.getByText('次へ');

      // When
      fireEvent.changeText(input, '');

      // Then
      expect(nextButton).toBeDisabled();
    });

    it('表示名の文字数制限チェック', async () => {
      // Given
      render(<ProfileSetup step="displayName" />);
      const input = screen.getByTestId('display-name-input');

      // When
      fireEvent.changeText(input, 'a'.repeat(51)); // 50文字制限超過

      // Then
      await waitFor(() => {
        expect(screen.getByText('表示名は50文字以内で入力してください')).toBeOnTheScreen();
      });
    });
  });

  describe('ProfileText', () => {
    it('自己紹介文入力画面が正しく表示される', () => {
      // Given & When
      render(<ProfileSetup step="profileText" />);

      // Then
      expect(screen.getByText('自己紹介文を入力してください')).toBeOnTheScreen();
      expect(screen.getByTestId('profile-text-input')).toBeOnTheScreen();
      expect(screen.getByText('スキップ')).toBeOnTheScreen();
    });

    it('文字数カウンターが正しく動作する', async () => {
      // Given
      render(<ProfileSetup step="profileText" />);
      const input = screen.getByTestId('profile-text-input');

      // When
      fireEvent.changeText(input, 'テスト自己紹介文');

      // Then
      await waitFor(() => {
        expect(screen.getByText('9 / 500')).toBeOnTheScreen();
      });
    });
  });

  describe('ProfileImage', () => {
    it('プロフィール画像設定画面が正しく表示される', () => {
      // Given & When
      render(<ProfileSetup step="profileImage" />);

      // Then
      expect(screen.getByText('プロフィール画像を設定してください')).toBeOnTheScreen();
      expect(screen.getByTestId('camera-button')).toBeOnTheScreen();
      expect(screen.getByTestId('gallery-button')).toBeOnTheScreen();
    });

    it('画像選択後にプレビューが表示される', async () => {
      // Given
      render(<ProfileSetup step="profileImage" />);
      const galleryButton = screen.getByTestId('gallery-button');

      // When
      fireEvent.press(galleryButton);

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('image-preview')).toBeOnTheScreen();
      });
    });
  });

  describe('IntroAudio', () => {
    it('音声録音画面が正しく表示される', () => {
      // Given & When
      render(<ProfileSetup step="introAudio" />);

      // Then
      expect(screen.getByText('自己紹介音声を録音してください')).toBeOnTheScreen();
      expect(screen.getByTestId('record-button')).toBeOnTheScreen();
    });

    it('録音開始・停止が正しく動作する', async () => {
      // Given
      render(<ProfileSetup step="introAudio" />);
      const recordButton = screen.getByTestId('record-button');

      // When - 録音開始
      fireEvent.press(recordButton);

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('recording-indicator')).toBeOnTheScreen();
        expect(screen.getByText('録音中...')).toBeOnTheScreen();
      });

      // When - 録音停止
      fireEvent.press(recordButton);

      // Then
      await waitFor(() => {
        expect(screen.getByTestId('audio-preview')).toBeOnTheScreen();
        expect(screen.getByTestId('play-button')).toBeOnTheScreen();
      });
    });

    it('録音時間が5分を超える場合警告が表示される', async () => {
      // Given
      render(<ProfileSetup step="introAudio" />);
      
      // When
      // 5分超過の音声録音をシミュレート
      fireEvent(screen.getByTestId('record-button'), 'onRecordingComplete', {
        duration: 301000 // 5分1秒
      });

      // Then
      await waitFor(() => {
        expect(screen.getByText('録音時間は5分以内にしてください')).toBeOnTheScreen();
      });
    });
  });
});
# 認証・アカウント管理機能 テスト仕様書

## 1. 概要

### 1.1 目的
「目醒め人のためのSNS」の認証・アカウント管理機能のテスト駆動開発（TDD）のための詳細なテスト仕様書です。

### 1.2 対象機能
- Google OAuth認証
- Apple Sign-In認証  
- Email + Passkey認証
- 複数アカウント管理（最大5アカウント）
- プロフィール管理
- 通知設定管理

### 1.3 テスト種別
1. **APIユニットテスト**: Supabase API エンドポイントの単体テスト
2. **UIユニットテスト**: React Nativeコンポーネントの単体テスト
3. **結合テスト**: フロントエンド-バックエンド間の統合テスト
4. **E2Eテスト**: エンドツーエンドのユーザーシナリオテスト

## 2. テスト環境・ツール

### 2.1 使用ライブラリ
```json
{
  "jest-expo": "~53.0.0",
  "@testing-library/react-native": "^13",
  "@testing-library/jest-native": "^6",
  "react-native-reanimated/mock": "latest"
}
```

### 2.2 テスト設定
```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    '<rootDir>/src/test-utils/setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.spec.{ts,tsx}',
    '!src/test-utils/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### 2.3 モック戦略
- **最小限のモック使用**: 実際のSupabaseテストクライアントを使用
- **外部サービスのみモック**: Google OAuth, Apple Sign-In, FCM
- **ネットワークレスポンス**: MSW (Mock Service Worker) を使用

## 3. APIユニットテスト

### 3.1 認証API テスト

#### 3.1.1 Google OAuth 認証

```typescript
// src/lib/__tests__/authService.test.ts
describe('Google OAuth Authentication', () => {
  describe('signInWithGoogle', () => {
    it('新規ユーザー登録が成功する', async () => {
      // Given
      const mockIdToken = 'mock_google_id_token';
      const expectedUser = {
        id: expect.any(String),
        email: 'test@example.com',
        displayName: 'Test User'
      };

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user).toMatchObject(expectedUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('既存ユーザーのログインが成功する', async () => {
      // Given
      const existingUser = await createTestUser();
      const mockIdToken = 'mock_existing_user_token';

      // When
      const result = await authService.signInWithGoogle(mockIdToken);

      // Then
      expect(result.user.id).toBe(existingUser.id);
      expect(result.accessToken).toBeDefined();
    });

    it('無効なIDトークンでエラーが発生する', async () => {
      // Given
      const invalidToken = 'invalid_token';

      // When & Then
      await expect(authService.signInWithGoogle(invalidToken))
        .rejects.toThrow('INVALID_TOKEN');
    });

    it('ネットワークエラーで適切なエラーが発生する', async () => {
      // Given
      server.use(
        rest.post('/auth/google', (req, res, ctx) => {
          return res.networkError('Failed to connect');
        })
      );

      // When & Then
      await expect(authService.signInWithGoogle('token'))
        .rejects.toThrow('NETWORK_ERROR');
    });
  });

  describe('refreshToken', () => {
    it('有効なリフレッシュトークンで新しいアクセストークンを取得', async () => {
      // Given
      const validRefreshToken = 'valid_refresh_token';

      // When
      const result = await authService.refreshToken(validRefreshToken);

      // Then
      expect(result.accessToken).toBeDefined();
      expect(result.expiresIn).toBeGreaterThan(0);
    });

    it('無効なリフレッシュトークンでエラーが発生する', async () => {
      // Given
      const invalidRefreshToken = 'invalid_refresh_token';

      // When & Then
      await expect(authService.refreshToken(invalidRefreshToken))
        .rejects.toThrow('TOKEN_EXPIRED');
    });
  });
});
```

#### 3.1.2 Apple Sign-In 認証

```typescript
describe('Apple Sign-In Authentication', () => {
  describe('signInWithApple', () => {
    it('Apple ID認証が成功する', async () => {
      // Given
      const mockAppleCredential = {
        identityToken: 'mock_apple_identity_token',
        authorizationCode: 'mock_auth_code'
      };

      // When
      const result = await authService.signInWithApple(mockAppleCredential);

      // Then
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('Apple認証がキャンセルされた場合の処理', async () => {
      // Given
      const cancelledCredential = null;

      // When & Then
      await expect(authService.signInWithApple(cancelledCredential))
        .rejects.toThrow('AUTH_CANCELLED');
    });
  });
});
```

#### 3.1.3 Passkey 認証

```typescript
describe('Passkey Authentication', () => {
  describe('registerWithPasskey', () => {
    it('パスキー登録が成功する', async () => {
      // Given
      const email = 'test@example.com';
      const mockCredential = {
        id: 'credential_id',
        rawId: new ArrayBuffer(32),
        type: 'public-key'
      };

      // When
      const result = await authService.registerWithPasskey(email, mockCredential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
    });

    it('既存メールアドレスでエラーが発生する', async () => {
      // Given
      const existingEmail = 'existing@example.com';
      await createTestUser({ email: existingEmail });

      // When & Then
      await expect(authService.registerWithPasskey(existingEmail, mockCredential))
        .rejects.toThrow('EMAIL_ALREADY_EXISTS');
    });
  });

  describe('signInWithPasskey', () => {
    it('パスキーログインが成功する', async () => {
      // Given
      const email = 'test@example.com';
      const credential = await setupPasskeyUser(email);

      // When
      const result = await authService.signInWithPasskey(email, credential);

      // Then
      expect(result.user.email).toBe(email);
      expect(result.accessToken).toBeDefined();
    });
  });
});
```

### 3.2 ユーザー管理API テスト

#### 3.2.1 プロフィール取得・更新

```typescript
describe('User Profile API', () => {
  describe('getCurrentUser', () => {
    it('認証済みユーザーのプロフィールを取得', async () => {
      // Given
      const user = await createAuthenticatedUser();

      // When
      const profile = await userService.getCurrentUser();

      // Then
      expect(profile).toMatchObject({
        id: user.id,
        displayName: expect.any(String),
        email: user.email
      });
    });

    it('未認証の場合401エラーが発生', async () => {
      // Given
      await authService.signOut();

      // When & Then
      await expect(userService.getCurrentUser())
        .rejects.toThrow('UNAUTHORIZED');
    });
  });

  describe('updateProfile', () => {
    it('プロフィール更新が成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const updateData = {
        displayName: '新しい表示名',
        profileText: '自己紹介文',
        prefecture: '東京都',
        city: '渋谷区'
      };

      // When
      const updatedProfile = await userService.updateProfile(updateData);

      // Then
      expect(updatedProfile).toMatchObject(updateData);
    });

    it('バリデーションエラーで400エラーが発生', async () => {
      // Given
      const invalidData = {
        displayName: '', // 空文字は無効
        profileText: 'a'.repeat(1001) // 1000文字制限超過
      };

      // When & Then
      await expect(userService.updateProfile(invalidData))
        .rejects.toThrow('VALIDATION_ERROR');
    });

    it('表示名の重複チェック', async () => {
      // Given
      await createTestUser({ displayName: '既存ユーザー' });
      const user = await createAuthenticatedUser();

      // When & Then
      await expect(userService.updateProfile({ displayName: '既存ユーザー' }))
        .rejects.toThrow('DISPLAY_NAME_TAKEN');
    });
  });
});
```

#### 3.2.2 メディアアップロード

```typescript
describe('Media Upload API', () => {
  describe('uploadProfileImage', () => {
    it('プロフィール画像アップロードが成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const imageFile = createMockImageFile();

      // When
      const result = await userService.uploadProfileImage(imageFile);

      // Then
      expect(result.imageUrl).toMatch(/^https:\/\/cdn\.kanushi\.tld\/.+\.jpg$/);
      expect(result.imageUrl).toBeDefined();
    });

    it('不正なファイル形式でエラーが発生', async () => {
      // Given
      const invalidFile = createMockFile('text/plain');

      // When & Then
      await expect(userService.uploadProfileImage(invalidFile))
        .rejects.toThrow('INVALID_FILE_TYPE');
    });

    it('ファイルサイズ制限超過でエラーが発生', async () => {
      // Given
      const largeFile = createMockImageFile(10 * 1024 * 1024); // 10MB

      // When & Then
      await expect(userService.uploadProfileImage(largeFile))
        .rejects.toThrow('FILE_TOO_LARGE');
    });
  });

  describe('uploadIntroAudio', () => {
    it('自己紹介音声アップロードが成功する', async () => {
      // Given
      const audioFile = createMockAudioFile();

      // When
      const result = await userService.uploadIntroAudio(audioFile);

      // Then
      expect(result.audioUrl).toMatch(/^https:\/\/cdn\.kanushi\.tld\/.+\.mp3$/);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('音声時間制限チェック', async () => {
      // Given
      const longAudioFile = createMockAudioFile(301); // 5分1秒

      // When & Then
      await expect(userService.uploadIntroAudio(longAudioFile))
        .rejects.toThrow('AUDIO_TOO_LONG');
    });
  });
});
```

### 3.3 アカウント管理API テスト

#### 3.3.1 複数アカウント管理

```typescript
describe('Account Management API', () => {
  describe('getAccounts', () => {
    it('ユーザーの全アカウントを取得', async () => {
      // Given
      const user = await createAuthenticatedUser();
      await createAdditionalAccount(user.id);

      // When
      const accounts = await accountService.getAccounts();

      // Then
      expect(accounts).toHaveLength(2);
      expect(accounts[0].isActive).toBe(true);
      expect(accounts.every(acc => acc.switchOrder >= 1 && acc.switchOrder <= 5)).toBe(true);
    });
  });

  describe('switchAccount', () => {
    it('アカウント切替が成功する', async () => {
      // Given
      const user = await createAuthenticatedUser();
      const secondAccount = await createAdditionalAccount(user.id);

      // When
      const result = await accountService.switchAccount(secondAccount.id);

      // Then
      expect(result.accessToken).toBeDefined();
      expect(result.activeAccountId).toBe(secondAccount.id);
    });

    it('存在しないアカウントIDでエラーが発生', async () => {
      // Given
      const invalidAccountId = 'non-existent-id';

      // When & Then
      await expect(accountService.switchAccount(invalidAccountId))
        .rejects.toThrow('ACCOUNT_NOT_FOUND');
    });

    it('他人のアカウントへの切替でエラーが発生', async () => {
      // Given
      const otherUser = await createTestUser();
      const otherAccount = await createAccount(otherUser.id);

      // When & Then
      await expect(accountService.switchAccount(otherAccount.id))
        .rejects.toThrow('FORBIDDEN');
    });
  });

  describe('addAccount', () => {
    it('5アカウント未満の場合、新規アカウント追加が成功', async () => {
      // Given
      const user = await createAuthenticatedUser();
      // 既に3アカウント作成
      await Promise.all([
        createAdditionalAccount(user.id),
        createAdditionalAccount(user.id),
        createAdditionalAccount(user.id)
      ]);

      // When
      const newAccount = await accountService.addAccount(mockGoogleToken);

      // Then
      expect(newAccount.switchOrder).toBe(5);
      expect(newAccount.isActive).toBe(true);
    });

    it('5アカウント制限でエラーが発生', async () => {
      // Given
      const user = await createAuthenticatedUser();
      // 既に4アカウント追加（合計5アカウント）
      await Promise.all(Array(4).fill(null).map(() => createAdditionalAccount(user.id)));

      // When & Then
      await expect(accountService.addAccount(mockGoogleToken))
        .rejects.toThrow('ACCOUNT_LIMIT_EXCEEDED');
    });
  });
});
```

### 3.4 通知設定API テスト

```typescript
describe('Notification Settings API', () => {
  describe('getNotificationSettings', () => {
    it('デフォルト通知設定を取得', async () => {
      // Given
      const user = await createAuthenticatedUser();

      // When
      const settings = await notificationService.getNotificationSettings();

      // Then
      expect(settings).toMatchObject({
        comment: true,
        highlight: true,
        follow: true,
        gift: true
      });
    });
  });

  describe('updateNotificationSettings', () => {
    it('通知設定更新が成功する', async () => {
      // Given
      const newSettings = {
        comment: false,
        highlight: true,
        follow: false,
        gift: true
      };

      // When
      await notificationService.updateNotificationSettings(newSettings);
      const updatedSettings = await notificationService.getNotificationSettings();

      // Then
      expect(updatedSettings).toMatchObject(newSettings);
    });
  });

  describe('updateFcmToken', () => {
    it('FCMトークン更新が成功する', async () => {
      // Given
      const fcmToken = 'new_fcm_token_12345';

      // When
      await notificationService.updateFcmToken(fcmToken);

      // Then
      const user = await userService.getCurrentUser();
      expect(user.fcmToken).toBe(fcmToken);
    });

    it('FCMトークン削除（null設定）が成功する', async () => {
      // Given
      await notificationService.updateFcmToken('some_token');

      // When
      await notificationService.updateFcmToken(null);

      // Then
      const user = await userService.getCurrentUser();
      expect(user.fcmToken).toBeNull();
    });
  });
});
```

## 4. UIユニットテスト

### 4.1 認証画面コンポーネント

#### 4.1.1 ログイン画面

```typescript
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
```

#### 4.1.2 オンボーディング画面

```typescript
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
```

### 4.2 プロフィール画面コンポーネント

#### 4.2.1 プロフィール表示

```typescript
// src/screens/__tests__/Profile.test.tsx
describe('Profile Screen', () => {
  it('自分のプロフィールが正しく表示される', async () => {
    // Given
    const mockUser = {
      id: 'user123',
      displayName: 'テストユーザー',
      profileText: '自己紹介文です',
      profileImageUrl: 'https://example.com/image.jpg',
      introAudioUrl: 'https://example.com/audio.mp3'
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
      displayName: '他のユーザー'
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
```

#### 4.2.2 プロフィール編集

```typescript
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
```

### 4.3 共通コンポーネント

#### 4.3.1 複数アカウント切替

```typescript
// src/components/__tests__/AccountSwitcher.test.tsx
describe('AccountSwitcher Component', () => {
  it('アカウント一覧が正しく表示される', async () => {
    // Given
    const mockAccounts = [
      { id: 'acc1', profile: { displayName: 'アカウント1' }, isActive: true },
      { id: 'acc2', profile: { displayName: 'アカウント2' }, isActive: false }
    ];
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      expect(screen.getByText('アカウント1')).toBeOnTheScreen();
      expect(screen.getByText('アカウント2')).toBeOnTheScreen();
    });
  });

  it('アクティブアカウントにチェックマークが表示される', async () => {
    // Given
    const mockAccounts = [
      { id: 'acc1', profile: { displayName: 'アカウント1' }, isActive: true },
      { id: 'acc2', profile: { displayName: 'アカウント2' }, isActive: false }
    ];
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      expect(screen.getByTestId('active-account-indicator')).toBeOnTheScreen();
    });
  });

  it('アカウント選択で切替が実行される', async () => {
    // Given
    const mockSwitchAccount = jest.fn().mockResolvedValue({});
    jest.spyOn(accountService, 'switchAccount').mockImplementation(mockSwitchAccount);

    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // When
    const account2 = await screen.findByText('アカウント2');
    fireEvent.press(account2);

    // Then
    expect(mockSwitchAccount).toHaveBeenCalledWith('acc2');
  });

  it('アカウント追加ボタンで新規アカウント作成フローが開始される', async () => {
    // Given
    const mockOnAddAccount = jest.fn();
    render(<AccountSwitcher visible={true} onClose={jest.fn()} onAddAccount={mockOnAddAccount} />);

    // When
    const addButton = screen.getByText('アカウントを追加');
    fireEvent.press(addButton);

    // Then
    expect(mockOnAddAccount).toHaveBeenCalled();
  });

  it('5アカウント制限時にアカウント追加ボタンが無効になる', async () => {
    // Given
    const mockAccounts = Array(5).fill(null).map((_, i) => ({
      id: `acc${i + 1}`,
      profile: { displayName: `アカウント${i + 1}` },
      isActive: i === 0
    }));
    jest.spyOn(accountService, 'getAccounts').mockResolvedValue(mockAccounts);

    // When
    render(<AccountSwitcher visible={true} onClose={jest.fn()} />);

    // Then
    await waitFor(() => {
      const addButton = screen.getByText('アカウントを追加');
      expect(addButton).toBeDisabled();
    });
  });
});
```

## 5. 結合テスト

### 5.1 認証フロー結合テスト

```typescript
// src/__tests__/integration/auth-flow.test.ts
describe('Authentication Flow Integration', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  it('新規ユーザー登録からオンボーディング完了まで', async () => {
    // Given
    const navigation = createMockNavigation();
    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    // When - ログイン画面でGoogle認証
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - オンボーディング画面に遷移
    await waitFor(() => {
      expect(getByText('表示名を入力してください')).toBeOnTheScreen();
    });

    // When - 表示名入力
    const displayNameInput = getByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, 'テストユーザー');
    fireEvent.press(getByText('次へ'));

    // Then - 自己紹介文入力画面に遷移
    await waitFor(() => {
      expect(getByText('自己紹介文を入力してください')).toBeOnTheScreen();
    });

    // When - 自己紹介文をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - プロフィール画像設定画面に遷移
    await waitFor(() => {
      expect(getByText('プロフィール画像を設定してください')).toBeOnTheScreen();
    });

    // When - プロフィール画像をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - 音声録音画面に遷移
    await waitFor(() => {
      expect(getByText('自己紹介音声を録音してください')).toBeOnTheScreen();
    });

    // When - 音声録音をスキップ
    fireEvent.press(getByText('スキップ'));

    // Then - 外部リンク設定画面に遷移
    await waitFor(() => {
      expect(getByText('外部リンクを設定してください')).toBeOnTheScreen();
    });

    // When - 完了ボタンをタップ
    fireEvent.press(getByText('完了'));

    // Then - ホーム画面に遷移
    await waitFor(() => {
      expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
    });

    // Then - ユーザーデータが正しく保存されている
    const savedUser = await userService.getCurrentUser();
    expect(savedUser.displayName).toBe('テストユーザー');
  });

  it('既存ユーザーのログイン', async () => {
    // Given - 既存ユーザーをDB作成
    const existingUser = await createTestUser({
      displayName: '既存ユーザー',
      email: 'existing@example.com'
    });

    const { getByTestId, getByText } = render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    // When - ログイン画面でGoogle認証（既存ユーザー）
    mockGoogleSignIn(existingUser.email);
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - 直接ホーム画面に遷移（オンボーディングスキップ）
    await waitFor(() => {
      expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
    }, { timeout: 5000 });

    // Then - 正しいユーザー情報が取得される
    const currentUser = await userService.getCurrentUser();
    expect(currentUser.id).toBe(existingUser.id);
    expect(currentUser.displayName).toBe('既存ユーザー');
  });

  it('認証エラーハンドリング', async () => {
    // Given
    mockGoogleSignInError('INVALID_TOKEN');
    const { getByTestId, getByText } = render(<App />);

    // When
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then
    await waitFor(() => {
      expect(getByText('認証に失敗しました。もう一度お試しください。')).toBeOnTheScreen();
    });

    // Then - ログイン画面に留まる
    expect(getByText('Googleアカウント連携')).toBeOnTheScreen();
  });
});
```

### 5.2 プロフィール管理結合テスト

```typescript
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
```

### 5.3 複数アカウント管理結合テスト

```typescript
describe('Multiple Account Management Integration', () => {
  it('アカウント追加から切替まで', async () => {
    // Given - 認証済みユーザー
    const primaryUser = await setupAuthenticatedUser();
    const { getByTestId, getByText } = render(<App />);

    // When - プロフィール長押しでアカウント切替画面表示
    const profileIcon = getByTestId('profile-icon');
    fireEvent(profileIcon, 'onLongPress');

    // Then - アカウント切替画面が表示される
    await waitFor(() => {
      expect(getByText('アカウント切替')).toBeOnTheScreen();
    });

    // When - アカウント追加ボタンタップ
    const addAccountButton = getByText('アカウントを追加');
    fireEvent.press(addAccountButton);

    // Then - Google認証画面が表示される
    await waitFor(() => {
      expect(getByTestId('google-signin-button')).toBeOnTheScreen();
    });

    // When - 新しいGoogleアカウントで認証
    mockGoogleSignIn('second@example.com');
    const googleButton = getByTestId('google-signin-button');
    fireEvent.press(googleButton);

    // Then - 新アカウントでオンボーディング開始
    await waitFor(() => {
      expect(getByText('表示名を入力してください')).toBeOnTheScreen();
    });

    // When - オンボーディング完了
    const displayNameInput = getByTestId('display-name-input');
    fireEvent.changeText(displayNameInput, 'セカンドアカウント');
    fireEvent.press(getByText('次へ'));
    
    // ... オンボーディング工程をスキップ
    fireEvent.press(getByText('完了'));

    // Then - 新アカウントでホーム画面表示
    await waitFor(() => {
      expect(getByText('ファミリータイムライン')).toBeOnTheScreen();
    });

    // When - 再度アカウント切替画面を表示
    fireEvent(profileIcon, 'onLongPress');

    // Then - 2つのアカウントが表示される
    await waitFor(() => {
      expect(getByText('セカンドアカウント')).toBeOnTheScreen();
      expect(getByText(primaryUser.displayName)).toBeOnTheScreen();
    });

    // When - プライマリアカウントに切替
    fireEvent.press(getByText(primaryUser.displayName));

    // Then - プライマリアカウントの画面が表示される
    await waitFor(() => {
      const currentUser = userService.getCurrentUser();
      expect(currentUser.id).toBe(primaryUser.id);
    });
  });

  it('5アカウント制限のテスト', async () => {
    // Given - 既に5アカウント作成済み
    await Promise.all(Array(5).fill(null).map((_, i) => 
      createTestAccount(`user${i}@example.com`)
    ));

    const { getByTestId, getByText } = render(<App />);

    // When - アカウント切替画面表示
    const profileIcon = getByTestId('profile-icon');
    fireEvent(profileIcon, 'onLongPress');

    // Then - アカウント追加ボタンが無効
    await waitFor(() => {
      const addButton = getByText('アカウントを追加');
      expect(addButton).toBeDisabled();
    });

    // When - 無効なアカウント追加ボタンをタップ
    fireEvent.press(getByText('アカウントを追加'));

    // Then - エラーメッセージ表示
    await waitFor(() => {
      expect(getByText('アカウントは最大5つまで作成できます')).toBeOnTheScreen();
    });
  });
});
```

## 6. E2Eテスト

### 6.1 新規ユーザー登録E2Eテスト

```typescript
// e2e/__tests__/user-registration.e2e.ts
describe('User Registration E2E', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    await resetTestDatabase();
  });

  it('新規ユーザーが完全な登録フローを完了できる', async () => {
    // Given - アプリ起動
    await expect(element(by.text('ログイン'))).toBeVisible();

    // When - Google認証ボタンタップ
    await element(by.id('google-signin-button')).tap();

    // Then - オンボーディング開始
    await waitFor(element(by.text('表示名を入力してください')))
      .toBeVisible()
      .withTimeout(10000);

    // When - 表示名入力
    await element(by.id('display-name-input')).typeText('E2Eテストユーザー');
    await element(by.text('次へ')).tap();

    // Then - 自己紹介文画面
    await expect(element(by.text('自己紹介文を入力してください'))).toBeVisible();

    // When - 自己紹介文入力
    await element(by.id('profile-text-input')).typeText('これはE2Eテストユーザーです');
    await element(by.text('次へ')).tap();

    // Then - プロフィール画像設定画面
    await expect(element(by.text('プロフィール画像を設定してください'))).toBeVisible();

    // When - カメラで撮影
    await element(by.id('camera-button')).tap();
    await element(by.id('capture-button')).tap();
    await element(by.text('使用する')).tap();
    await element(by.text('次へ')).tap();

    // Then - 音声録音画面
    await expect(element(by.text('自己紹介音声を録音してください'))).toBeVisible();

    // When - 音声録音
    await element(by.id('record-button')).tap();
    await sleep(3000); // 3秒録音
    await element(by.id('record-button')).tap(); // 停止
    await element(by.text('次へ')).tap();

    // Then - 外部リンク設定画面
    await expect(element(by.text('外部リンクを設定してください'))).toBeVisible();

    // When - 外部リンク入力
    await element(by.id('external-link-input')).typeText('https://example.com');
    await element(by.text('完了')).tap();

    // Then - ホーム画面表示
    await waitFor(element(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(15000);

    // Then - プロフィール確認
    await element(by.id('profile-tab')).tap();
    await expect(element(by.text('E2Eテストユーザー'))).toBeVisible();
    await expect(element(by.text('これはE2Eテストユーザーです'))).toBeVisible();
    await expect(element(by.id('profile-image'))).toBeVisible();
    await expect(element(by.id('intro-audio-player'))).toBeVisible();
  });

  it('オンボーディング中断後の再開', async () => {
    // Given - オンボーディング途中でアプリ終了
    await element(by.id('google-signin-button')).tap();
    await waitFor(element(by.text('表示名を入力してください'))).toBeVisible();
    await element(by.id('display-name-input')).typeText('中断テストユーザー');
    
    // When - アプリをバックグラウンドに移動して再開
    await device.sendToHome();
    await sleep(2000);
    await device.launchApp({ newInstance: false });

    // Then - オンボーディングが続行される
    await expect(element(by.text('表示名を入力してください'))).toBeVisible();
    await expect(element(by.id('display-name-input'))).toHaveText('中断テストユーザー');
  });
});
```

### 6.2 認証・ログインE2Eテスト

```typescript
describe('Authentication E2E', () => {
  it('既存ユーザーのログインが成功する', async () => {
    // Given - 既存ユーザーを事前作成
    await createE2EUser({
      email: 'e2e-existing@example.com',
      displayName: '既存E2Eユーザー'
    });

    // When - アプリ起動してログイン
    await element(by.id('google-signin-button')).tap();

    // Then - 直接ホーム画面に遷移
    await waitFor(element(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(10000);

    // Then - 正しいユーザー情報が表示される
    await element(by.id('profile-tab')).tap();
    await expect(element(by.text('既存E2Eユーザー'))).toBeVisible();
  });

  it('ネットワーク接続エラー時の処理', async () => {
    // Given - ネットワークを無効化
    await device.disableNetwork();

    // When - ログイン試行
    await element(by.id('google-signin-button')).tap();

    // Then - エラーメッセージ表示
    await waitFor(element(by.text('ネットワークエラーが発生しました')))
      .toBeVisible()
      .withTimeout(5000);

    // When - ネットワーク復旧
    await device.enableNetwork();
    await element(by.text('再試行')).tap();

    // Then - 正常にログイン完了
    await waitFor(element(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('Apple Sign-Inでの認証', async () => {
    // When - Apple Sign-Inボタンタップ
    await element(by.id('apple-signin-button')).tap();

    // Then - Apple認証画面表示
    await waitFor(element(by.text('Apple IDでサインイン')))
      .toBeVisible()
      .withTimeout(5000);

    // When - Touch ID/Face IDで認証
    await element(by.id('apple-auth-biometric')).tap();

    // Then - オンボーディングまたはホーム画面へ
    await waitFor(element(by.text('表示名を入力してください')).or(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(10000);
  });
});
```

### 6.3 プロフィール管理E2Eテスト

```typescript
describe('Profile Management E2E', () => {
  beforeEach(async () => {
    await setupE2EUser();
  });

  it('プロフィール編集の完全フロー', async () => {
    // Given - ホーム画面からプロフィールタブ
    await element(by.id('profile-tab')).tap();
    await expect(element(by.text('テストユーザー'))).toBeVisible();

    // When - プロフィール編集ボタンタップ
    await element(by.id('edit-profile-button')).tap();

    // Then - 編集画面表示
    await expect(element(by.text('プロフィール編集'))).toBeVisible();

    // When - 表示名変更
    await element(by.id('display-name-input')).clearText();
    await element(by.id('display-name-input')).typeText('更新されたテストユーザー');

    // When - 自己紹介文変更
    await element(by.id('profile-text-input')).clearText();
    await element(by.id('profile-text-input')).typeText('更新された自己紹介文です');

    // When - プロフィール画像変更
    await element(by.id('profile-image-button')).tap();
    await element(by.text('ギャラリーから選択')).tap();
    await element(by.id('first-image')).tap();
    await element(by.text('選択')).tap();

    // When - 音声変更
    await element(by.id('intro-audio-button')).tap();
    await element(by.id('record-button')).tap();
    await sleep(2000); // 2秒録音
    await element(by.id('record-button')).tap();
    await element(by.text('使用する')).tap();

    // When - 外部リンク変更
    await element(by.id('external-link-input')).clearText();
    await element(by.id('external-link-input')).typeText('https://updated.example.com');

    // When - 保存実行
    await element(by.text('保存')).tap();

    // Then - 保存完了メッセージ
    await expect(element(by.text('プロフィールを更新しました'))).toBeVisible();

    // Then - プロフィール画面に戻る
    await waitFor(element(by.text('更新されたテストユーザー')))
      .toBeVisible()
      .withTimeout(5000);

    // Then - 変更が反映されている
    await expect(element(by.text('更新された自己紹介文です'))).toBeVisible();
    await expect(element(by.id('updated-profile-image'))).toBeVisible();
  });

  it('プロフィール編集バリデーションエラー', async () => {
    // Given
    await element(by.id('profile-tab')).tap();
    await element(by.id('edit-profile-button')).tap();

    // When - 表示名を空にする
    await element(by.id('display-name-input')).clearText();
    await element(by.text('保存')).tap();

    // Then - バリデーションエラー表示
    await expect(element(by.text('表示名は必須です'))).toBeVisible();

    // When - 長すぎる表示名を入力
    await element(by.id('display-name-input')).typeText('a'.repeat(51));
    await element(by.text('保存')).tap();

    // Then - 文字数制限エラー表示
    await expect(element(by.text('表示名は50文字以内で入力してください'))).toBeVisible();
  });
});
```

### 6.4 複数アカウント管理E2Eテスト

```typescript
describe('Multiple Account Management E2E', () => {
  it('アカウント追加・切替の完全フロー', async () => {
    // Given - 1つ目のアカウントでログイン済み
    await setupE2EUser({ displayName: 'プライマリユーザー' });

    // When - プロフィールアイコン長押し
    await element(by.id('profile-icon')).longPress();

    // Then - アカウント切替画面表示
    await expect(element(by.text('アカウント切替'))).toBeVisible();
    await expect(element(by.text('プライマリユーザー'))).toBeVisible();

    // When - アカウント追加ボタンタップ
    await element(by.text('アカウントを追加')).tap();

    // Then - 認証画面表示
    await expect(element(by.id('google-signin-button'))).toBeVisible();

    // When - 新しいGoogleアカウントで認証
    await element(by.id('google-signin-button')).tap();

    // Then - 新規アカウントのオンボーディング
    await waitFor(element(by.text('表示名を入力してください')))
      .toBeVisible()
      .withTimeout(10000);

    // When - 2つ目のアカウント設定
    await element(by.id('display-name-input')).typeText('セカンダリユーザー');
    await element(by.text('次へ')).tap();
    // ... 残りのオンボーディングをスキップ
    await element(by.text('完了')).tap();

    // Then - 2つ目のアカウントでホーム画面表示
    await waitFor(element(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(10000);

    // When - 再度アカウント切替画面を表示
    await element(by.id('profile-icon')).longPress();

    // Then - 2つのアカウントが表示される
    await expect(element(by.text('セカンダリユーザー'))).toBeVisible();
    await expect(element(by.text('プライマリユーザー'))).toBeVisible();
    await expect(element(by.id('active-account-indicator'))).toBeVisible();

    // When - プライマリアカウントに切替
    await element(by.text('プライマリユーザー')).tap();

    // Then - プライマリアカウントの画面が表示
    await waitFor(element(by.text('ファミリータイムライン')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('profile-tab')).tap();
    await expect(element(by.text('プライマリユーザー'))).toBeVisible();
  });

  it('5アカウント制限の動作確認', async () => {
    // Given - 既に5つのアカウントを作成
    await Promise.all(Array(5).fill(null).map((_, i) => 
      createE2EAccount(`user${i}@example.com`, `ユーザー${i + 1}`)
    ));

    // When - アカウント切替画面表示
    await element(by.id('profile-icon')).longPress();

    // Then - 5つのアカウントが表示される
    await expect(element(by.text('ユーザー1'))).toBeVisible();
    await expect(element(by.text('ユーザー5'))).toBeVisible();

    // Then - アカウント追加ボタンが無効
    await expect(element(by.text('アカウントを追加'))).not.toBeVisible();
    await expect(element(by.text('アカウント上限に達しています'))).toBeVisible();
  });
});
```

### 6.5 通知設定E2Eテスト

```typescript
describe('Notification Settings E2E', () => {
  beforeEach(async () => {
    await setupE2EUser();
  });

  it('通知設定の変更', async () => {
    // Given - 設定画面に移動
    await element(by.id('profile-tab')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.text('通知設定')).tap();

    // Then - 通知設定画面表示
    await expect(element(by.text('プッシュ通知設定'))).toBeVisible();

    // When - プッシュ通知を無効化
    await element(by.id('push-notification-toggle')).tap();

    // Then - 確認ダイアログ表示
    await expect(element(by.text('プッシュ通知を無効にしますか？'))).toBeVisible();
    await element(by.text('はい')).tap();

    // When - 個別設定を変更
    await element(by.id('comment-notification-toggle')).tap();
    await element(by.id('follow-notification-toggle')).tap();

    // When - 設定保存
    await element(by.text('保存')).tap();

    // Then - 保存完了メッセージ
    await expect(element(by.text('通知設定を更新しました'))).toBeVisible();

    // When - 設定画面を再表示して確認
    await element(by.text('戻る')).tap();
    await element(by.text('通知設定')).tap();

    // Then - 変更が保存されている
    await expect(element(by.id('push-notification-toggle'))).toHaveToggleValue(false);
    await expect(element(by.id('comment-notification-toggle'))).toHaveToggleValue(false);
    await expect(element(by.id('follow-notification-toggle'))).toHaveToggleValue(false);
  });
});
```

## 7. テストデータとモック戦略

### 7.1 テストデータファクトリー

```typescript
// src/test-utils/factories.ts
export const userFactory = {
  build: (overrides: Partial<User> = {}): User => ({
    id: faker.datatype.uuid(),
    email: faker.internet.email(),
    displayName: faker.name.fullName(),
    profileText: faker.lorem.paragraph(),
    profileImageUrl: faker.image.avatar(),
    introAudioUrl: faker.internet.url(),
    externalLinkUrl: faker.internet.url(),
    prefecture: '東京都',
    city: '渋谷区',
    fcmToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides
  }),

  buildList: (count: number, overrides?: Partial<User>): User[] =>
    Array(count).fill(null).map(() => userFactory.build(overrides))
};

export const accountFactory = {
  build: (overrides: Partial<Account> = {}): Account => ({
    id: faker.datatype.uuid(),
    profileId: faker.datatype.uuid(),
    isActive: false,
    switchOrder: faker.datatype.number({ min: 1, max: 5 }),
    lastSwitchedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  })
};
```

### 7.2 モックサービス

```typescript
// src/test-utils/mocks.ts
export const mockAuthService = {
  signInWithGoogle: jest.fn(),
  signInWithApple: jest.fn(),
  signInWithPasskey: jest.fn(),
  refreshToken: jest.fn(),
  signOut: jest.fn()
};

export const mockUserService = {
  getCurrentUser: jest.fn(),
  updateProfile: jest.fn(),
  uploadProfileImage: jest.fn(),
  uploadIntroAudio: jest.fn()
};

export const mockNotificationService = {
  getNotificationSettings: jest.fn(),
  updateNotificationSettings: jest.fn(),
  updateFcmToken: jest.fn()
};
```

### 7.3 Supabaseテストクライアント

```typescript
// src/test-utils/supabase-test-client.ts
export const createTestSupabaseClient = () => {
  return createClient(
    'https://test-project.supabase.co',
    'test-anon-key',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
};
```

## 8. テスト実行・CI設定

### 8.1 package.json スクリプト

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testMatch='**/*.test.{ts,tsx}'",
    "test:integration": "jest --testMatch='**/*.integration.test.{ts,tsx}'",
    "test:e2e": "detox test",
    "test:e2e:ios": "detox test --configuration ios.sim.debug",
    "test:e2e:android": "detox test --configuration android.emu.debug"
  }
}
```

### 8.2 GitHub Actions CI設定

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup test database
        run: npm run test:db:setup
      
      - name: Run integration tests
        run: npm run test:integration

  e2e-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Setup iOS Simulator
        run: |
          xcrun simctl create "Test iPhone" com.apple.CoreSimulator.SimDeviceType.iPhone-14
          xcrun simctl boot "Test iPhone"
      
      - name: Build app for testing
        run: npx detox build --configuration ios.sim.debug
      
      - name: Run E2E tests
        run: npx detox test --configuration ios.sim.debug
```

## 9. 実装計画更新

このテスト仕様書の作成により、実装計画書の以下のセクションを更新します：

- [x] 認証・アカウント管理のテスト仕様書作成（2025-05-25）
- [ ] Phase 1実装時にこのテスト仕様書に基づいてTDD実装
- [ ] テストカバレッジ80%以上の達成
- [ ] E2Eテストの自動化CI/CD統合

---

**更新日**: 2025-05-25  
**作成者**: Claude Code AI Assistant  
**レビュー状況**: 初版作成完了
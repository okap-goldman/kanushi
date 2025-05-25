# ストーリーズ機能テスト仕様書

## 概要

本ドキュメントは「目醒め人のためのSNS」のストーリーズ機能に対するテスト仕様を定義します。TDDによる実装のための包括的なテストケースを提供します。

### テスト環境
- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock

### テスト方針
- モックの使用は最小限に抑制
- 実際のAPI通信はテスト環境のSupabaseを使用
- UI操作は実際のコンポーネントを使用

## 1. APIユニットテスト

### 1.1 ストーリー一覧取得API

```typescript
// src/lib/__tests__/storyService.test.ts
describe('Story Service API Tests', () => {
  describe('fetchStories', () => {
    test('正常な一覧取得', async () => {
      // Given: 有効なJWTトークンとストーリーが存在
      const authToken = await setupTestUser();
      await createTestStories(3);

      // When: ストーリー一覧を取得
      const stories = await storyService.fetchStories();

      // Then: 期待される結果
      expect(stories).toHaveLength(3);
      expect(stories[0]).toMatchObject({
        id: expect.any(String),
        user: expect.objectContaining({
          id: expect.any(String),
          displayName: expect.any(String)
        }),
        imageUrl: expect.stringMatching(/^https?:\/\//),
        editData: expect.any(Object),
        isRepost: expect.any(Boolean),
        expiresAt: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    test('期限切れストーリーは取得されない', async () => {
      // Given: 期限切れストーリーが存在
      await createExpiredTestStory();
      
      // When: ストーリー一覧を取得
      const stories = await storyService.fetchStories();

      // Then: 期限切れストーリーは含まれない
      expect(stories).toHaveLength(0);
    });

    test('認証エラー時は401を返す', async () => {
      // Given: 無効なトークン
      setInvalidToken();

      // When & Then: 認証エラーが発生
      await expect(storyService.fetchStories()).rejects.toMatchObject({
        status: 401,
        type: 'INVALID_TOKEN'
      });
    });
  });

  describe('createStory', () => {
    test('正常なストーリー作成', async () => {
      // Given: 認証済みユーザーと画像データ
      const authToken = await setupTestUser();
      const imageFile = createTestImageFile();
      const editData = {
        text: [{ content: 'Hello World', x: 100, y: 200 }],
        stickers: [],
        location: { name: 'Tokyo', lat: 35.6762, lng: 139.6503 }
      };

      // When: ストーリーを作成
      const story = await storyService.createStory({
        image: imageFile,
        editData,
        location: 'Tokyo'
      });

      // Then: 期待される結果
      expect(story).toMatchObject({
        id: expect.any(String),
        user: expect.objectContaining({
          id: authToken.userId
        }),
        imageUrl: expect.stringMatching(/^https?:\/\//),
        editData: editData,
        isRepost: false,
        expiresAt: expect.any(String),
        createdAt: expect.any(String)
      });

      // 有効期限が24時間後に設定されている
      const expiresAt = new Date(story.expiresAt);
      const now = new Date();
      const hoursDiff = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeCloseTo(24, 1);
    });

    test('画像なしでは作成できない', async () => {
      // Given: 認証済みユーザーだが画像なし
      await setupTestUser();

      // When & Then: バリデーションエラーが発生
      await expect(storyService.createStory({
        editData: {},
        location: null
      })).rejects.toMatchObject({
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    });

    test('サポートされない画像形式では作成できない', async () => {
      // Given: 認証済みユーザーと無効な画像形式
      await setupTestUser();
      const invalidFile = createTestFile('test.txt', 'text/plain');

      // When & Then: バリデーションエラーが発生
      await expect(storyService.createStory({
        image: invalidFile,
        editData: {},
        location: null
      })).rejects.toMatchObject({
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    });

    test('ファイルサイズ制限を超える場合は作成できない', async () => {
      // Given: 認証済みユーザーと大きすぎる画像
      await setupTestUser();
      const largeFile = createLargeTestImageFile(11 * 1024 * 1024); // 11MB

      // When & Then: バリデーションエラーが発生
      await expect(storyService.createStory({
        image: largeFile,
        editData: {},
        location: null
      })).rejects.toMatchObject({
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    });
  });

  describe('repostStory', () => {
    test('正常な再投稿', async () => {
      // Given: 認証済みユーザーと他ユーザーのストーリー
      const currentUser = await setupTestUser();
      const originalStory = await createTestStoryByOtherUser();

      // When: ストーリーを再投稿
      const repost = await storyService.repostStory(originalStory.id);

      // Then: 期待される結果
      expect(repost).toMatchObject({
        id: expect.any(String),
        user: expect.objectContaining({
          id: currentUser.id
        }),
        imageUrl: originalStory.imageUrl,
        editData: originalStory.editData,
        isRepost: true,
        originalStoryId: originalStory.id,
        expiresAt: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    test('存在しないストーリーの再投稿は失敗', async () => {
      // Given: 認証済みユーザーと存在しないストーリーID
      await setupTestUser();
      const nonExistentId = 'non-existent-id';

      // When & Then: 404エラーが発生
      await expect(storyService.repostStory(nonExistentId)).rejects.toMatchObject({
        status: 404,
        type: 'RESOURCE_NOT_FOUND'
      });
    });

    test('期限切れストーリーの再投稿は失敗', async () => {
      // Given: 認証済みユーザーと期限切れストーリー
      await setupTestUser();
      const expiredStory = await createExpiredTestStory();

      // When & Then: 404エラーが発生
      await expect(storyService.repostStory(expiredStory.id)).rejects.toMatchObject({
        status: 404,
        type: 'RESOURCE_NOT_FOUND'
      });
    });

    test('自分のストーリーの再投稿は可能', async () => {
      // Given: 認証済みユーザーと自分のストーリー
      const currentUser = await setupTestUser();
      const myStory = await createTestStoryByCurrentUser();

      // When: 自分のストーリーを再投稿
      const repost = await storyService.repostStory(myStory.id);

      // Then: 正常に再投稿される
      expect(repost.isRepost).toBe(true);
      expect(repost.originalStoryId).toBe(myStory.id);
    });
  });

  describe('deleteStory', () => {
    test('正常なストーリー削除', async () => {
      // Given: 認証済みユーザーと自分のストーリー
      const currentUser = await setupTestUser();
      const myStory = await createTestStoryByCurrentUser();

      // When: ストーリーを削除
      await storyService.deleteStory(myStory.id);

      // Then: ストーリーが削除される
      const stories = await storyService.fetchStories();
      expect(stories.find(s => s.id === myStory.id)).toBeUndefined();
    });

    test('他ユーザーのストーリー削除は失敗', async () => {
      // Given: 認証済みユーザーと他ユーザーのストーリー
      await setupTestUser();
      const otherStory = await createTestStoryByOtherUser();

      // When & Then: 403エラーが発生
      await expect(storyService.deleteStory(otherStory.id)).rejects.toMatchObject({
        status: 403,
        type: 'FORBIDDEN'
      });
    });

    test('存在しないストーリーの削除は失敗', async () => {
      // Given: 認証済みユーザーと存在しないストーリーID
      await setupTestUser();
      const nonExistentId = 'non-existent-id';

      // When & Then: 404エラーが発生
      await expect(storyService.deleteStory(nonExistentId)).rejects.toMatchObject({
        status: 404,
        type: 'RESOURCE_NOT_FOUND'
      });
    });
  });
});
```

### 1.2 画像アップロードAPI

```typescript
// src/lib/__tests__/uploadService.test.ts
describe('Upload Service API Tests', () => {
  describe('uploadStoryImage', () => {
    test('正常な画像アップロード', async () => {
      // Given: 認証済みユーザーと有効な画像ファイル
      await setupTestUser();
      const imageFile = createTestImageFile();

      // When: 画像をアップロード
      const result = await uploadService.uploadStoryImage(imageFile);

      // Then: 期待される結果
      expect(result).toMatchObject({
        imageUrl: expect.stringMatching(/^https?:\/\//),
        objectKey: expect.any(String)
      });

      // アップロードされた画像にアクセス可能
      const response = await fetch(result.imageUrl);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toMatch(/^image\//);
    });

    test('プリサインドURL取得エラー', async () => {
      // Given: 認証済みユーザーと無効な画像データ
      await setupTestUser();
      const invalidFile = null;

      // When & Then: バリデーションエラーが発生
      await expect(uploadService.uploadStoryImage(invalidFile)).rejects.toMatchObject({
        status: 400,
        type: 'VALIDATION_ERROR'
      });
    });

    test('ネットワークエラー時のリトライ', async () => {
      // Given: 認証済みユーザーとネットワークエラーを発生させるモック
      await setupTestUser();
      const imageFile = createTestImageFile();
      mockNetworkError(1); // 1回失敗後に成功

      // When: 画像をアップロード（リトライあり）
      const result = await uploadService.uploadStoryImage(imageFile);

      // Then: リトライ後に成功
      expect(result.imageUrl).toBeTruthy();
    });
  });
});
```

## 2. UIユニットテスト

### 2.1 ストーリーズリストコンポーネント

```typescript
// src/components/stories/__tests__/StoriesRow.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { StoriesRow } from '../StoriesRow';
import { createTestStoryData } from '../../../__tests__/helpers/storyHelpers';

describe('StoriesRow Component', () => {
  test('ストーリーサークルが正しく表示される', async () => {
    // Given: ストーリーデータ
    const stories = [
      createTestStoryData({ user: { displayName: 'Alice' } }),
      createTestStoryData({ user: { displayName: 'Bob' } }),
    ];

    // When: コンポーネントをレンダリング
    render(<StoriesRow stories={stories} />);

    // Then: 期待される要素が表示される
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Bob')).toBeTruthy();
    });

    // プロフィール画像が表示される
    const storyCircles = screen.getAllByTestId('story-circle');
    expect(storyCircles).toHaveLength(2);
  });

  test('自分のストーリーが最初に表示される', async () => {
    // Given: 自分のストーリーと他ユーザーのストーリー
    const currentUserId = 'current-user-id';
    const stories = [
      createTestStoryData({ user: { id: 'other-user', displayName: 'Other' } }),
      createTestStoryData({ user: { id: currentUserId, displayName: 'Me' } }),
    ];

    // When: コンポーネントをレンダリング
    render(<StoriesRow stories={stories} currentUserId={currentUserId} />);

    // Then: 自分のストーリーが最初に表示される
    const storyCircles = screen.getAllByTestId('story-circle');
    expect(storyCircles[0]).toHaveTextContent('Me');
  });

  test('ストーリーがない場合は何も表示されない', () => {
    // Given: 空のストーリーデータ
    const stories = [];

    // When: コンポーネントをレンダリング
    render(<StoriesRow stories={stories} />);

    // Then: ストーリーサークルが表示されない
    const storyCircles = screen.queryAllByTestId('story-circle');
    expect(storyCircles).toHaveLength(0);
  });

  test('ストーリーサークルタップで閲覧開始', async () => {
    // Given: ストーリーデータとコールバック
    const stories = [createTestStoryData()];
    const onStoryPress = jest.fn();

    // When: コンポーネントをレンダリングしてタップ
    render(<StoriesRow stories={stories} onStoryPress={onStoryPress} />);
    
    const storyCircle = screen.getByTestId('story-circle');
    fireEvent.press(storyCircle);

    // Then: コールバックが呼ばれる
    expect(onStoryPress).toHaveBeenCalledWith(stories[0].user.id, 0);
  });

  test('新しいストーリーサークルにインジケーターが表示される', async () => {
    // Given: 新しいストーリーデータ
    const recentStory = createTestStoryData({
      createdAt: new Date().toISOString()
    });

    // When: コンポーネントをレンダリング
    render(<StoriesRow stories={[recentStory]} />);

    // Then: 新しいストーリーのインジケーターが表示される
    await waitFor(() => {
      const indicator = screen.getByTestId('new-story-indicator');
      expect(indicator).toBeTruthy();
    });
  });
});
```

### 2.2 ストーリービューアコンポーネント

```typescript
// src/components/stories/__tests__/StoryViewer.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { StoryViewer } from '../StoryViewer';
import { createTestStoryData } from '../../../__tests__/helpers/storyHelpers';

describe('StoryViewer Component', () => {
  test('ストーリーが正しく表示される', async () => {
    // Given: ストーリーデータ
    const story = createTestStoryData({
      user: { displayName: 'Alice' },
      editData: {
        text: [{ content: 'Hello World', x: 100, y: 200 }]
      }
    });

    // When: コンポーネントをレンダリング
    render(<StoryViewer story={story} />);

    // Then: 期待される要素が表示される
    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeTruthy();
      expect(screen.getByText('Hello World')).toBeTruthy();
    });

    // 画像が表示される
    const storyImage = screen.getByTestId('story-image');
    expect(storyImage).toBeTruthy();
  });

  test('プログレスバーが正しく動作する', async () => {
    // Given: ストーリーデータ
    const story = createTestStoryData();

    // When: コンポーネントをレンダリング
    render(<StoryViewer story={story} duration={5000} />);

    // Then: プログレスバーが表示される
    const progressBar = screen.getByTestId('story-progress');
    expect(progressBar).toBeTruthy();

    // プログレスが進行する
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    // プログレスが更新される（0.2 = 1000/5000）
    expect(progressBar.props.progress).toBeCloseTo(0.2, 1);
  });

  test('右タップで次のストーリーに進む', async () => {
    // Given: ストーリーデータとコールバック
    const story = createTestStoryData();
    const onNext = jest.fn();

    // When: コンポーネントをレンダリングして右側をタップ
    render(<StoryViewer story={story} onNext={onNext} />);
    
    const touchArea = screen.getByTestId('story-touch-area');
    fireEvent(touchArea, 'onPress', { nativeEvent: { locationX: 300 } }); // 右側をタップ

    // Then: onNextが呼ばれる
    expect(onNext).toHaveBeenCalled();
  });

  test('左タップで前のストーリーに戻る', async () => {
    // Given: ストーリーデータとコールバック
    const story = createTestStoryData();
    const onPrevious = jest.fn();

    // When: コンポーネントをレンダリングして左側をタップ
    render(<StoryViewer story={story} onPrevious={onPrevious} />);
    
    const touchArea = screen.getByTestId('story-touch-area');
    fireEvent(touchArea, 'onPress', { nativeEvent: { locationX: 50 } }); // 左側をタップ

    // Then: onPreviousが呼ばれる
    expect(onPrevious).toHaveBeenCalled();
  });

  test('下スワイプで閉じる', async () => {
    // Given: ストーリーデータとコールバック
    const story = createTestStoryData();
    const onClose = jest.fn();

    // When: コンポーネントをレンダリングして下にスワイプ
    render(<StoryViewer story={story} onClose={onClose} />);
    
    const touchArea = screen.getByTestId('story-touch-area');
    fireEvent(touchArea, 'onSwipeDown');

    // Then: onCloseが呼ばれる
    expect(onClose).toHaveBeenCalled();
  });

  test('再投稿ボタンが表示され動作する', async () => {
    // Given: 他ユーザーのストーリーデータ
    const story = createTestStoryData({
      user: { id: 'other-user' }
    });
    const onRepost = jest.fn();

    // When: コンポーネントをレンダリング
    render(<StoryViewer story={story} currentUserId="current-user" onRepost={onRepost} />);

    // Then: 再投稿ボタンが表示される
    const repostButton = screen.getByTestId('repost-button');
    expect(repostButton).toBeTruthy();

    // 再投稿ボタンをタップ
    fireEvent.press(repostButton);
    expect(onRepost).toHaveBeenCalledWith(story.id);
  });

  test('自分のストーリーでは削除ボタンが表示される', async () => {
    // Given: 自分のストーリーデータ
    const currentUserId = 'current-user';
    const story = createTestStoryData({
      user: { id: currentUserId }
    });
    const onDelete = jest.fn();

    // When: コンポーネントをレンダリング
    render(<StoryViewer story={story} currentUserId={currentUserId} onDelete={onDelete} />);

    // Then: 削除ボタンが表示される
    const deleteButton = screen.getByTestId('delete-button');
    expect(deleteButton).toBeTruthy();

    // 削除ボタンをタップ
    fireEvent.press(deleteButton);
    expect(onDelete).toHaveBeenCalledWith(story.id);
  });

  test('位置情報が表示される', async () => {
    // Given: 位置情報付きストーリー
    const story = createTestStoryData({
      editData: {
        location: { name: 'Tokyo, Japan' }
      }
    });

    // When: コンポーネントをレンダリング
    render(<StoryViewer story={story} />);

    // Then: 位置情報が表示される
    await waitFor(() => {
      expect(screen.getByText('Tokyo, Japan')).toBeTruthy();
    });
  });
});
```

### 2.3 ストーリー作成コンポーネント

```typescript
// src/components/stories/__tests__/CreateStoryDialog.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateStoryDialog } from '../CreateStoryDialog';
import * as ImagePicker from 'expo-image-picker';

// ImagePickerをモック
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
  ImagePickerResult: {},
}));

describe('CreateStoryDialog Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('ダイアログが正しく表示される', async () => {
    // Given: ダイアログを開く
    render(<CreateStoryDialog visible={true} />);

    // Then: 期待される要素が表示される
    expect(screen.getByText('ストーリーを作成')).toBeTruthy();
    expect(screen.getByText('カメラ')).toBeTruthy();
    expect(screen.getByText('ギャラリー')).toBeTruthy();
  });

  test('カメラボタンでカメラが起動する', async () => {
    // Given: カメラ結果をモック
    const mockCameraResult = {
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }]
    };
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockCameraResult);

    const onImageSelected = jest.fn();

    // When: ダイアログを表示してカメラボタンをタップ
    render(<CreateStoryDialog visible={true} onImageSelected={onImageSelected} />);
    
    const cameraButton = screen.getByText('カメラ');
    fireEvent.press(cameraButton);

    // Then: カメラが起動し画像が選択される
    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(onImageSelected).toHaveBeenCalledWith('file://test-image.jpg');
    });
  });

  test('ギャラリーボタンでギャラリーが起動する', async () => {
    // Given: ギャラリー結果をモック
    const mockGalleryResult = {
      canceled: false,
      assets: [{ uri: 'file://gallery-image.jpg' }]
    };
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue(mockGalleryResult);

    const onImageSelected = jest.fn();

    // When: ダイアログを表示してギャラリーボタンをタップ
    render(<CreateStoryDialog visible={true} onImageSelected={onImageSelected} />);
    
    const galleryButton = screen.getByText('ギャラリー');
    fireEvent.press(galleryButton);

    // Then: ギャラリーが起動し画像が選択される
    await waitFor(() => {
      expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
      expect(onImageSelected).toHaveBeenCalledWith('file://gallery-image.jpg');
    });
  });

  test('キャンセル時は何も実行されない', async () => {
    // Given: キャンセル結果をモック
    const mockCancelResult = { canceled: true };
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockCancelResult);

    const onImageSelected = jest.fn();

    // When: ダイアログを表示してカメラボタンをタップしてキャンセル
    render(<CreateStoryDialog visible={true} onImageSelected={onImageSelected} />);
    
    const cameraButton = screen.getByText('カメラ');
    fireEvent.press(cameraButton);

    // Then: onImageSelectedは呼ばれない
    await waitFor(() => {
      expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
      expect(onImageSelected).not.toHaveBeenCalled();
    });
  });

  test('ダイアログ外タップで閉じる', async () => {
    // Given: ダイアログとコールバック
    const onClose = jest.fn();

    // When: ダイアログを表示して外側をタップ
    render(<CreateStoryDialog visible={true} onClose={onClose} />);
    
    const overlay = screen.getByTestId('dialog-overlay');
    fireEvent.press(overlay);

    // Then: onCloseが呼ばれる
    expect(onClose).toHaveBeenCalled();
  });
});
```

## 3. 結合テスト

### 3.1 ストーリー作成フロー結合テスト

```typescript
// src/__tests__/integration/storyCreation.integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { App } from '../../App';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/testDatabase';
import * as ImagePicker from 'expo-image-picker';

describe('Story Creation Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('完全なストーリー作成フロー', async () => {
    // Given: ログイン済みユーザーとアプリ
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'file://test-story.jpg' }]
    };
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockImageResult);

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    // ログイン処理
    await loginAsTestUser();

    // When: ストーリー作成開始
    const createStoryButton = await screen.findByTestId('create-story-button');
    fireEvent.press(createStoryButton);

    // カメラオプションを選択
    const cameraOption = await screen.findByText('カメラ');
    fireEvent.press(cameraOption);

    // 画像編集画面に遷移
    await waitFor(() => {
      expect(screen.getByTestId('story-editor')).toBeTruthy();
    });

    // テキストを追加
    const addTextButton = screen.getByTestId('add-text-button');
    fireEvent.press(addTextButton);

    const textInput = screen.getByTestId('text-input');
    fireEvent.changeText(textInput, 'Hello Story!');

    const confirmTextButton = screen.getByTestId('confirm-text-button');
    fireEvent.press(confirmTextButton);

    // 位置情報を追加
    const addLocationButton = screen.getByTestId('add-location-button');
    fireEvent.press(addLocationButton);

    const locationInput = screen.getByTestId('location-input');
    fireEvent.changeText(locationInput, 'Tokyo, Japan');

    const confirmLocationButton = screen.getByTestId('confirm-location-button');
    fireEvent.press(confirmLocationButton);

    // ストーリーを投稿
    const shareButton = screen.getByTestId('share-story-button');
    fireEvent.press(shareButton);

    // Then: ストーリーが作成され、一覧に表示される
    await waitFor(() => {
      expect(screen.getByText('ストーリーを投稿しました')).toBeTruthy();
    });

    // ストーリー一覧に新しいストーリーが表示される
    await waitFor(() => {
      const storyCircle = screen.getByTestId('story-circle');
      expect(storyCircle).toBeTruthy();
    });
  });

  test('ストーリー作成中のエラーハンドリング', async () => {
    // Given: ネットワークエラーを発生させるモック
    mockNetworkError();

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    await loginAsTestUser();

    // When: ストーリー作成を試行
    const createStoryButton = await screen.findByTestId('create-story-button');
    fireEvent.press(createStoryButton);

    const cameraOption = await screen.findByText('カメラ');
    fireEvent.press(cameraOption);

    // エラー発生時のリトライ
    const shareButton = await screen.findByTestId('share-story-button');
    fireEvent.press(shareButton);

    // Then: エラーメッセージが表示される
    await waitFor(() => {
      expect(screen.getByText('投稿に失敗しました。再試行してください。')).toBeTruthy();
    });

    // リトライボタンが表示される
    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeTruthy();
  });

  test('ストーリー編集の取り消し', async () => {
    // Given: 編集中のストーリー
    const mockImageResult = {
      canceled: false,
      assets: [{ uri: 'file://test-story.jpg' }]
    };
    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue(mockImageResult);

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    await loginAsTestUser();

    // When: ストーリー編集を開始して取り消し
    const createStoryButton = await screen.findByTestId('create-story-button');
    fireEvent.press(createStoryButton);

    const cameraOption = await screen.findByText('カメラ');
    fireEvent.press(cameraOption);

    // 編集内容を追加
    const addTextButton = screen.getByTestId('add-text-button');
    fireEvent.press(addTextButton);

    const textInput = screen.getByTestId('text-input');
    fireEvent.changeText(textInput, 'Test text');

    // 取り消しボタンを押す
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);

    // Then: 確認ダイアログが表示される
    await waitFor(() => {
      expect(screen.getByText('編集内容が破棄されます。よろしいですか？')).toBeTruthy();
    });

    // 確認して取り消し
    const confirmCancelButton = screen.getByText('はい');
    fireEvent.press(confirmCancelButton);

    // ホーム画面に戻る
    await waitFor(() => {
      expect(screen.getByTestId('home-screen')).toBeTruthy();
    });
  });
});
```

### 3.2 ストーリー閲覧フロー結合テスト

```typescript
// src/__tests__/integration/storyViewing.integration.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { App } from '../../App';
import { setupTestDatabase, cleanupTestDatabase, createTestStories } from '../helpers/testDatabase';

describe('Story Viewing Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  test('複数ストーリーの連続閲覧', async () => {
    // Given: 複数のテストストーリー
    await createTestStories([
      { user: 'Alice', text: 'Alice Story' },
      { user: 'Bob', text: 'Bob Story' },
      { user: 'Charlie', text: 'Charlie Story' }
    ]);

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    await loginAsTestUser();

    // When: 最初のストーリーをタップ
    const firstStoryCircle = await screen.findByTestId('story-circle-0');
    fireEvent.press(firstStoryCircle);

    // Then: ストーリービューアが開く
    await waitFor(() => {
      expect(screen.getByTestId('story-viewer')).toBeTruthy();
      expect(screen.getByText('Alice Story')).toBeTruthy();
    });

    // 次のストーリーに進む（右タップ）
    const touchArea = screen.getByTestId('story-touch-area');
    fireEvent(touchArea, 'onPress', { nativeEvent: { locationX: 300 } });

    await waitFor(() => {
      expect(screen.getByText('Bob Story')).toBeTruthy();
    });

    // さらに次のストーリーに進む
    fireEvent(touchArea, 'onPress', { nativeEvent: { locationX: 300 } });

    await waitFor(() => {
      expect(screen.getByText('Charlie Story')).toBeTruthy();
    });

    // 最後のストーリーで右タップすると次のユーザーまたは閉じる
    fireEvent(touchArea, 'onPress', { nativeEvent: { locationX: 300 } });

    // ストーリービューアが閉じるかまたは次のユーザーに移る
    await waitFor(() => {
      // 実装に応じて期待値を調整
      expect(screen.queryByTestId('story-viewer')).toBeFalsy();
    });
  });

  test('ストーリーの自動進行', async () => {
    // Given: テストストーリー
    await createTestStories([
      { user: 'Alice', text: 'Auto Progress Test' }
    ]);

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    await loginAsTestUser();

    // When: ストーリーを開いて待機
    const storyCircle = await screen.findByTestId('story-circle-0');
    fireEvent.press(storyCircle);

    await waitFor(() => {
      expect(screen.getByTestId('story-viewer')).toBeTruthy();
    });

    // Then: 5秒後に自動で進行する
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5500));
    });

    // 次のストーリーまたは閉じる処理が実行される
    // 実装に応じて期待値を調整
  });

  test('ストーリー再投稿フロー', async () => {
    // Given: 他ユーザーのストーリー
    await createTestStories([
      { user: 'Alice', text: 'Repost Test', isOwnStory: false }
    ]);

    render(
      <NavigationContainer>
        <App />
      </NavigationContainer>
    );

    await loginAsTestUser();

    // When: ストーリーを開いて再投稿
    const storyCircle = await screen.findByTestId('story-circle-0');
    fireEvent.press(storyCircle);

    await waitFor(() => {
      expect(screen.getByTestId('story-viewer')).toBeTruthy();
    });

    const repostButton = screen.getByTestId('repost-button');
    fireEvent.press(repostButton);

    // 確認ダイアログ
    await waitFor(() => {
      expect(screen.getByText('このストーリーを再投稿しますか？')).toBeTruthy();
    });

    const confirmButton = screen.getByText('再投稿');
    fireEvent.press(confirmButton);

    // Then: 再投稿完了メッセージ
    await waitFor(() => {
      expect(screen.getByText('ストーリーを再投稿しました')).toBeTruthy();
    });

    // 自分のストーリー一覧に追加される
    const myStoryCircle = screen.getByTestId('my-story-circle');
    expect(myStoryCircle).toBeTruthy();
  });
});
```

## 4. E2Eテスト

### 4.1 ストーリー機能の包括的E2Eテスト

```typescript
// __tests__/e2e/stories.e2e.test.ts
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Stories E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await loginAsTestUser();
  });

  afterEach(async () => {
    await device.clearKeychain();
  });

  test('ストーリー作成から削除まで完全フロー', async () => {
    // Given: ログイン済み状態
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // When: ストーリー作成を開始
    await element(by.id('create-story-button')).tap();
    await detoxExpect(element(by.text('ストーリーを作成'))).toBeVisible();

    // カメラを選択（テスト環境では画像ピッカーをモック）
    await element(by.text('カメラ')).tap();

    // 画像が選択されると編集画面に遷移
    await detoxExpect(element(by.id('story-editor'))).toBeVisible();

    // テキストを追加
    await element(by.id('add-text-button')).tap();
    await element(by.id('text-input')).typeText('E2E Test Story');
    await element(by.id('confirm-text-button')).tap();

    // 位置情報を追加
    await element(by.id('add-location-button')).tap();
    await element(by.id('location-input')).typeText('Test Location');
    await element(by.id('confirm-location-button')).tap();

    // ストーリーを投稿
    await element(by.id('share-story-button')).tap();

    // Then: 投稿完了メッセージが表示される
    await detoxExpect(element(by.text('ストーリーを投稿しました'))).toBeVisible();

    // ホーム画面に戻る
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // ストーリーサークルが表示される
    await detoxExpect(element(by.id('story-circle'))).toBeVisible();

    // ストーリーを閲覧
    await element(by.id('story-circle')).tap();
    await detoxExpect(element(by.id('story-viewer'))).toBeVisible();
    await detoxExpect(element(by.text('E2E Test Story'))).toBeVisible();
    await detoxExpect(element(by.text('Test Location'))).toBeVisible();

    // ストーリーを削除
    await element(by.id('delete-button')).tap();
    await detoxExpect(element(by.text('このストーリーを削除しますか？'))).toBeVisible();
    await element(by.text('削除')).tap();

    // Then: ストーリーが削除される
    await detoxExpect(element(by.text('ストーリーを削除しました'))).toBeVisible();
    await detoxExpect(element(by.id('story-circle'))).not.toBeVisible();
  });

  test('複数ユーザーのストーリー閲覧フロー', async () => {
    // Given: 複数ユーザーのストーリーが存在する状態（事前にセットアップ）
    await setupMultipleUserStories();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // When: 最初のストーリーを開始
    await element(by.id('story-circle-0')).tap();
    await detoxExpect(element(by.id('story-viewer'))).toBeVisible();

    // ストーリーを順番に閲覧
    for (let i = 0; i < 3; i++) {
      // 右タップで次のストーリーに進む
      await element(by.id('story-touch-area')).tap({ x: 300, y: 400 });
      await device.sleep(500); // アニメーション待機
    }

    // 前のストーリーに戻る
    await element(by.id('story-touch-area')).tap({ x: 50, y: 400 });
    await device.sleep(500);

    // ストーリーを閉じる
    await element(by.id('story-touch-area')).swipe('down');

    // Then: ホーム画面に戻る
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  test('ストーリー再投稿フロー', async () => {
    // Given: 他ユーザーのストーリーが存在
    await setupOtherUserStory();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // When: 他ユーザーのストーリーを開く
    await element(by.id('story-circle-other')).tap();
    await detoxExpect(element(by.id('story-viewer'))).toBeVisible();

    // 再投稿ボタンをタップ
    await element(by.id('repost-button')).tap();
    await detoxExpect(element(by.text('このストーリーを再投稿しますか？'))).toBeVisible();
    await element(by.text('再投稿')).tap();

    // Then: 再投稿完了メッセージ
    await detoxExpect(element(by.text('ストーリーを再投稿しました'))).toBeVisible();

    // ホーム画面で自分のストーリーが追加されている
    await detoxExpect(element(by.id('my-story-circle'))).toBeVisible();

    // 自分のストーリーを確認
    await element(by.id('my-story-circle')).tap();
    await detoxExpect(element(by.id('story-viewer'))).toBeVisible();
    await detoxExpect(element(by.id('repost-indicator'))).toBeVisible();
  });

  test('ネットワークエラー時のリトライ機能', async () => {
    // Given: ネットワークエラーが発生する状態をモック
    await device.setNetworkCondition('offline');
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // When: ストーリー作成を試行
    await element(by.id('create-story-button')).tap();
    await element(by.text('カメラ')).tap();
    await element(by.id('share-story-button')).tap();

    // Then: エラーメッセージが表示される
    await detoxExpect(element(by.text('投稿に失敗しました。ネットワーク接続を確認してください。'))).toBeVisible();

    // ネットワークを復旧
    await device.setNetworkCondition('fast');

    // リトライボタンをタップ
    await element(by.id('retry-button')).tap();

    // 投稿が成功する
    await detoxExpect(element(by.text('ストーリーを投稿しました'))).toBeVisible();
  });

  test('24時間期限でのストーリー表示制御', async () => {
    // Given: 期限切れ間近のストーリーを作成（テスト用に短時間設定）
    await createExpiringSoonStory();
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // 期限前はストーリーが表示される
    await detoxExpect(element(by.id('expiring-story-circle'))).toBeVisible();

    // When: 期限切れまで待機（テスト用に短時間設定）
    await device.sleep(2000);
    await element(by.id('home-screen')).swipe('down'); // リフレッシュ

    // Then: 期限切れストーリーは表示されない
    await detoxExpect(element(by.id('expiring-story-circle'))).not.toBeVisible();
  });

  test('画像編集機能の総合テスト', async () => {
    // Given: ストーリー作成画面
    await element(by.id('create-story-button')).tap();
    await element(by.text('カメラ')).tap();
    await detoxExpect(element(by.id('story-editor'))).toBeVisible();

    // When: 複数の編集要素を追加
    // テキスト追加
    await element(by.id('add-text-button')).tap();
    await element(by.id('text-input')).typeText('Text 1');
    await element(by.id('confirm-text-button')).tap();

    // 2つ目のテキスト追加
    await element(by.id('add-text-button')).tap();
    await element(by.id('text-input')).typeText('Text 2');
    await element(by.id('confirm-text-button')).tap();

    // スタンプ追加
    await element(by.id('add-sticker-button')).tap();
    await element(by.id('sticker-heart')).tap();

    // 位置情報追加
    await element(by.id('add-location-button')).tap();
    await element(by.id('location-input')).typeText('Multiple Elements Test');
    await element(by.id('confirm-location-button')).tap();

    // ストーリーを投稿
    await element(by.id('share-story-button')).tap();

    // Then: すべての編集要素が含まれたストーリーが投稿される
    await detoxExpect(element(by.text('ストーリーを投稿しました'))).toBeVisible();

    // ストーリーを確認
    await element(by.id('story-circle')).tap();
    await detoxExpect(element(by.text('Text 1'))).toBeVisible();
    await detoxExpect(element(by.text('Text 2'))).toBeVisible();
    await detoxExpect(element(by.id('sticker-heart'))).toBeVisible();
    await detoxExpect(element(by.text('Multiple Elements Test'))).toBeVisible();
  });
});

// ヘルパー関数
async function loginAsTestUser() {
  // E2Eテスト用のログイン処理
  await element(by.id('email-input')).typeText('test@example.com');
  await element(by.id('password-input')).typeText('testpassword');
  await element(by.id('login-button')).tap();
  await detoxExpected(element(by.id('home-screen'))).toBeVisible();
}

async function setupMultipleUserStories() {
  // 複数ユーザーのストーリーをセットアップ
  // テスト用のAPIを使用またはモックデータを準備
}

async function setupOtherUserStory() {
  // 他ユーザーのストーリーをセットアップ
}

async function createExpiringSoonStory() {
  // 期限切れ間近のストーリーを作成
}
```

## テストデータとヘルパー関数

### テストヘルパー

```typescript
// src/__tests__/helpers/storyHelpers.ts
export function createTestStoryData(overrides = {}) {
  return {
    id: 'test-story-id',
    user: {
      id: 'test-user-id',
      displayName: 'Test User',
      profileImageUrl: 'https://example.com/avatar.jpg'
    },
    imageUrl: 'https://example.com/story.jpg',
    editData: {
      text: [],
      stickers: [],
      location: null
    },
    isRepost: false,
    originalStoryId: null,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

export function createTestImageFile() {
  // テスト用の画像ファイルオブジェクトを作成
  return {
    uri: 'file://test-image.jpg',
    type: 'image/jpeg',
    name: 'test-image.jpg'
  };
}

export async function setupTestUser() {
  // テスト用ユーザーのセットアップ
  // 実際のSupabaseテスト環境でユーザーを作成
}

export async function createTestStories(count = 1) {
  // 指定数のテストストーリーを作成
}
```

## まとめ

本テスト仕様書は、ストーリーズ機能の包括的なテストケースを提供します：

1. **APIユニットテスト**: 各APIエンドポイントの正常系・異常系テスト
2. **UIユニットテスト**: コンポーネントの表示・操作・状態管理テスト
3. **結合テスト**: 複数コンポーネント間の連携テスト
4. **E2Eテスト**: ユーザーシナリオに基づく端到端テスト

TDDアプローチでの実装時は、これらのテストケースを段階的に実装し、グリーンにしていくことで、堅牢なストーリーズ機能を構築できます。
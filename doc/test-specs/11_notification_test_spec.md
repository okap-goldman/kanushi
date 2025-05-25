# 通知機能テスト仕様書

## 1. 概要

本仕様書は「目醒め人のためのSNS」の通知機能に関するテスト仕様を定義します。

### 1.1 テスト対象機能
- FCMトークン管理
- 通知設定管理
- 通知配信（コメント、ハイライト、フォロー、ギフト）
- 通知一覧取得と既読処理
- リアルタイム通知
- エラーハンドリング

### 1.2 テスト環境
- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock
- React Native (iOS/Android)
- Supabase (Backend)
- Firebase Cloud Messaging

## 2. APIユニットテスト

### 2.1 FCMトークン管理

#### 2.1.1 FCMトークン更新
```typescript
// __tests__/api/fcm-token.test.ts
import { supabase } from '@/lib/supabase';

describe('FCM Token API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('FCMトークンを正常に更新できること', async () => {
    const fcmToken = 'test-fcm-token-123456';
    const userId = 'test-user-id';

    const { data, error } = await supabase
      .from('profiles')
      .update({ fcm_token: fcmToken })
      .eq('id', userId)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.fcm_token).toBe(fcmToken);
  });

  test('無効なトークンでエラーが返ること', async () => {
    const invalidToken = '';
    const userId = 'test-user-id';

    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: invalidToken })
      .eq('id', userId);

    expect(error).toBeDefined();
    expect(error.code).toBe('23514'); // CHECK制約違反
  });

  test('認証エラーが適切に処理されること', async () => {
    // 認証なしでアクセス
    const { error } = await supabase
      .from('profiles')
      .update({ fcm_token: 'token' })
      .eq('id', 'user-id');

    expect(error).toBeDefined();
    expect(error.code).toBe('42501'); // RLSポリシー違反
  });
});
```

### 2.2 通知設定管理

#### 2.2.1 通知設定取得
```typescript
// __tests__/api/notification-settings.test.ts
import { supabase } from '@/lib/supabase';

describe('Notification Settings API', () => {
  const userId = 'test-user-id';

  beforeEach(async () => {
    // テストデータ準備
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        notification_type: 'comment',
        enabled: true
      });
  });

  test('通知設定を取得できること', async () => {
    const { data, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId);

    expect(error).toBeNull();
    expect(data).toHaveLength(4); // comment, highlight, follow, gift
    expect(data[0]).toMatchObject({
      user_id: userId,
      notification_type: expect.any(String),
      enabled: expect.any(Boolean)
    });
  });

  test('特定の通知タイプの設定を更新できること', async () => {
    const { data, error } = await supabase
      .from('notification_settings')
      .update({ enabled: false })
      .eq('user_id', userId)
      .eq('notification_type', 'comment')
      .select()
      .single();

    expect(error).toBeNull();
    expect(data.enabled).toBe(false);
  });

  test('一括更新ができること', async () => {
    const updates = [
      { notification_type: 'comment', enabled: true },
      { notification_type: 'highlight', enabled: false },
      { notification_type: 'follow', enabled: true },
      { notification_type: 'gift', enabled: false }
    ];

    for (const update of updates) {
      await supabase
        .from('notification_settings')
        .update({ enabled: update.enabled })
        .eq('user_id', userId)
        .eq('notification_type', update.notification_type);
    }

    const { data } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', userId)
      .order('notification_type');

    expect(data[0].enabled).toBe(true);  // comment
    expect(data[1].enabled).toBe(true);  // follow
    expect(data[2].enabled).toBe(false); // gift
    expect(data[3].enabled).toBe(false); // highlight
  });
});
```

### 2.3 通知作成

#### 2.3.1 コメント通知作成
```typescript
// __tests__/api/notification-create.test.ts
import { supabase } from '@/lib/supabase';
import { createNotification } from '@/lib/notificationService';

describe('Notification Creation API', () => {
  const postAuthorId = 'post-author-id';
  const commenterId = 'commenter-id';
  const postId = 'test-post-id';

  beforeEach(async () => {
    // 通知設定を有効化
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: postAuthorId,
        notification_type: 'comment',
        enabled: true
      });
  });

  test('コメント通知が作成されること', async () => {
    const notification = await createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: '新しいコメント',
      body: 'テストユーザーさんがコメントしました',
      data: {
        postId,
        commentId: 'test-comment-id',
        commenterId
      }
    });

    expect(notification).toMatchObject({
      user_id: postAuthorId,
      notification_type: 'comment',
      title: '新しいコメント',
      body: expect.stringContaining('コメントしました'),
      is_read: false
    });
  });

  test('通知設定がOFFの場合は通知が作成されないこと', async () => {
    // 通知設定をOFFに
    await supabase
      .from('notification_settings')
      .update({ enabled: false })
      .eq('user_id', postAuthorId)
      .eq('notification_type', 'comment');

    const notification = await createNotification({
      userId: postAuthorId,
      type: 'comment',
      title: '新しいコメント',
      body: 'テスト',
      data: { postId }
    });

    expect(notification).toBeNull();
  });

  test('ハイライト通知が理由付きで作成されること', async () => {
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: postAuthorId,
        notification_type: 'highlight',
        enabled: true
      });

    const notification = await createNotification({
      userId: postAuthorId,
      type: 'highlight',
      title: '投稿がハイライトされました',
      body: 'テストユーザーさんがあなたの投稿をハイライトしました',
      data: {
        postId,
        highlightId: 'test-highlight-id',
        reason: '深い洞察に感銘を受けました'
      }
    });

    expect(notification.data.reason).toBe('深い洞察に感銘を受けました');
  });
});
```

### 2.4 通知取得・既読処理

```typescript
// __tests__/api/notification-read.test.ts
import { supabase } from '@/lib/supabase';

describe('Notification Read API', () => {
  const userId = 'test-user-id';
  let notificationId: string;

  beforeEach(async () => {
    // テスト通知作成
    const { data } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'テスト通知',
        body: 'これはテスト通知です',
        notification_type: 'comment',
        data: { postId: 'test-post' },
        is_read: false
      })
      .select()
      .single();
    
    notificationId = data.id;
  });

  test('通知一覧を取得できること', async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toMatchObject({
      user_id: userId,
      is_read: false
    });
  });

  test('単一通知を既読にできること', async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    expect(error).toBeNull();

    // 確認
    const { data } = await supabase
      .from('notifications')
      .select('is_read')
      .eq('id', notificationId)
      .single();

    expect(data.is_read).toBe(true);
  });

  test('一括既読処理ができること', async () => {
    // 複数の未読通知を作成
    await supabase
      .from('notifications')
      .insert([
        { user_id: userId, title: '通知1', body: 'test', notification_type: 'follow', is_read: false },
        { user_id: userId, title: '通知2', body: 'test', notification_type: 'gift', is_read: false }
      ]);

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    expect(error).toBeNull();

    // 確認
    const { data } = await supabase
      .from('notifications')
      .select('is_read')
      .eq('user_id', userId);

    expect(data.every(n => n.is_read)).toBe(true);
  });
});
```

## 3. UIユニットテスト

### 3.1 通知設定画面

```typescript
// __tests__/ui/NotificationSettings.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { supabase } from '@/lib/supabase';

// モックは使用しない方針だが、FCMは例外的にモック
jest.mock('@react-native-firebase/messaging', () => ({
  default: () => ({
    requestPermission: jest.fn().mockResolvedValue(1),
    getToken: jest.fn().mockResolvedValue('mock-token')
  })
}));

describe('NotificationSettings Component', () => {
  const mockSettings = {
    comment: true,
    highlight: true,
    follow: false,
    gift: true
  };

  test('通知設定が正しく表示されること', async () => {
    const { getByText, getByTestId } = render(
      <NotificationSettings initialSettings={mockSettings} />
    );

    await waitFor(() => {
      expect(getByText('通知設定')).toBeTruthy();
      expect(getByText('コメント')).toBeTruthy();
      expect(getByText('ハイライト')).toBeTruthy();
      expect(getByText('新規フォロワー')).toBeTruthy();
      expect(getByText('ギフト提案')).toBeTruthy();
    });

    // スイッチの状態確認
    expect(getByTestId('switch-comment').props.value).toBe(true);
    expect(getByTestId('switch-highlight').props.value).toBe(true);
    expect(getByTestId('switch-follow').props.value).toBe(false);
    expect(getByTestId('switch-gift').props.value).toBe(true);
  });

  test('スイッチ切り替えで設定が更新されること', async () => {
    const onUpdate = jest.fn();
    const { getByTestId } = render(
      <NotificationSettings 
        initialSettings={mockSettings}
        onUpdate={onUpdate}
      />
    );

    const commentSwitch = getByTestId('switch-comment');
    fireEvent(commentSwitch, 'valueChange', false);

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith({
        ...mockSettings,
        comment: false
      });
    });
  });

  test('マスター設定で全通知を一括制御できること', async () => {
    const { getByTestId } = render(
      <NotificationSettings initialSettings={mockSettings} />
    );

    const masterSwitch = getByTestId('switch-master');
    fireEvent(masterSwitch, 'valueChange', false);

    await waitFor(() => {
      expect(getByTestId('switch-comment').props.value).toBe(false);
      expect(getByTestId('switch-highlight').props.value).toBe(false);
      expect(getByTestId('switch-follow').props.value).toBe(false);
      expect(getByTestId('switch-gift').props.value).toBe(false);
    });
  });

  test('通知許可ダイアログが表示されること', async () => {
    const { getByText, getByTestId } = render(
      <NotificationSettings 
        initialSettings={mockSettings}
        showPermissionRequest={true}
      />
    );

    expect(getByText('通知を有効にしてください')).toBeTruthy();
    
    const enableButton = getByTestId('enable-notifications');
    fireEvent.press(enableButton);

    // FCMトークン取得処理が呼ばれることを確認
    await waitFor(() => {
      expect(getByText('通知が有効になりました')).toBeTruthy();
    });
  });
});
```

### 3.2 通知一覧画面

```typescript
// __tests__/ui/NotificationList.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NotificationList } from '@/components/notification/NotificationList';

describe('NotificationList Component', () => {
  const mockNotifications = [
    {
      id: '1',
      title: '新しいコメント',
      body: 'テストユーザーさんがコメントしました',
      notification_type: 'comment',
      data: { postId: 'post-1' },
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: '投稿がハイライトされました',
      body: '別のユーザーさんがハイライトしました',
      notification_type: 'highlight',
      data: { postId: 'post-2', reason: '素晴らしい' },
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  test('通知一覧が正しく表示されること', async () => {
    const { getByText, getAllByTestId } = render(
      <NotificationList notifications={mockNotifications} />
    );

    expect(getByText('新しいコメント')).toBeTruthy();
    expect(getByText('投稿がハイライトされました')).toBeTruthy();
    
    const notificationItems = getAllByTestId(/notification-item-/);
    expect(notificationItems).toHaveLength(2);
  });

  test('未読通知にインジケーターが表示されること', () => {
    const { getByTestId, queryByTestId } = render(
      <NotificationList notifications={mockNotifications} />
    );

    // 未読通知
    expect(getByTestId('unread-indicator-1')).toBeTruthy();
    
    // 既読通知
    expect(queryByTestId('unread-indicator-2')).toBeNull();
  });

  test('通知をタップすると既読になること', async () => {
    const onRead = jest.fn();
    const { getByTestId } = render(
      <NotificationList 
        notifications={mockNotifications}
        onRead={onRead}
      />
    );

    const unreadNotification = getByTestId('notification-item-1');
    fireEvent.press(unreadNotification);

    await waitFor(() => {
      expect(onRead).toHaveBeenCalledWith('1');
    });
  });

  test('通知タイプ別のアイコンが表示されること', () => {
    const { getByTestId } = render(
      <NotificationList notifications={mockNotifications} />
    );

    expect(getByTestId('icon-comment-1')).toBeTruthy();
    expect(getByTestId('icon-highlight-2')).toBeTruthy();
  });

  test('空の通知一覧で適切なメッセージが表示されること', () => {
    const { getByText } = render(
      <NotificationList notifications={[]} />
    );

    expect(getByText('通知はありません')).toBeTruthy();
  });

  test('プルトゥリフレッシュで更新できること', async () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <NotificationList 
        notifications={mockNotifications}
        onRefresh={onRefresh}
      />
    );

    const scrollView = getByTestId('notification-scroll-view');
    fireEvent(scrollView, 'refresh');

    await waitFor(() => {
      expect(onRefresh).toHaveBeenCalled();
    });
  });
});
```

### 3.3 通知詳細表示

```typescript
// __tests__/ui/NotificationDetail.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { NotificationDetail } from '@/components/notification/NotificationDetail';
import { useNavigation } from '@react-navigation/native';

jest.mock('@react-navigation/native');

describe('NotificationDetail Component', () => {
  const mockNavigation = {
    navigate: jest.fn()
  };

  beforeEach(() => {
    (useNavigation as jest.Mock).mockReturnValue(mockNavigation);
  });

  test('コメント通知から投稿詳細へ遷移すること', () => {
    const notification = {
      id: '1',
      notification_type: 'comment',
      title: '新しいコメント',
      body: 'コメントがあります',
      data: { postId: 'post-123', commentId: 'comment-456' }
    };

    const { getByTestId } = render(
      <NotificationDetail notification={notification} />
    );

    const actionButton = getByTestId('notification-action');
    fireEvent.press(actionButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('PostDetail', {
      postId: 'post-123',
      scrollToCommentId: 'comment-456'
    });
  });

  test('フォロー通知からプロフィールへ遷移すること', () => {
    const notification = {
      id: '2',
      notification_type: 'follow',
      title: '新しいフォロワー',
      body: 'フォローされました',
      data: { 
        followerId: 'user-123',
        followType: 'family',
        followReason: 'コンテンツが素晴らしいから'
      }
    };

    const { getByTestId, getByText } = render(
      <NotificationDetail notification={notification} />
    );

    // フォロー理由が表示される
    expect(getByText('理由: コンテンツが素晴らしいから')).toBeTruthy();

    const actionButton = getByTestId('notification-action');
    fireEvent.press(actionButton);

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Profile', {
      userId: 'user-123'
    });
  });

  test('ギフト通知で金額が表示されること', () => {
    const notification = {
      id: '3',
      notification_type: 'gift',
      title: '光ギフトを受け取りました',
      body: 'ギフトが届きました',
      data: { 
        giftId: 'gift-123',
        amount: 600,
        message: '応援しています！',
        senderId: 'user-456'
      }
    };

    const { getByText } = render(
      <NotificationDetail notification={notification} />
    );

    expect(getByText('¥600')).toBeTruthy();
    expect(getByText('応援しています！')).toBeTruthy();
  });
});
```

## 4. 結合テスト

### 4.1 通知配信フロー

```typescript
// __tests__/integration/notification-flow.test.ts
import { supabase } from '@/lib/supabase';
import { createComment } from '@/lib/commentService';
import { waitForNotification } from '@/test-utils/notification-helpers';

describe('Notification Flow Integration', () => {
  let userA: any;
  let userB: any;
  let post: any;

  beforeAll(async () => {
    // テストユーザー作成
    userA = await createTestUser('userA');
    userB = await createTestUser('userB');
    
    // テスト投稿作成
    post = await createTestPost(userB.id, {
      content_type: 'text',
      text_content: 'テスト投稿'
    });

    // 通知設定を有効化
    await enableNotifications(userB.id, ['comment', 'highlight', 'follow', 'gift']);
  });

  test('コメント投稿で通知が作成・配信されること', async () => {
    // コメント投稿
    const comment = await createComment({
      postId: post.id,
      userId: userA.id,
      body: 'すばらしい投稿です！'
    });

    // 通知作成を待機
    const notification = await waitForNotification({
      userId: userB.id,
      type: 'comment',
      timeout: 5000
    });

    expect(notification).toMatchObject({
      user_id: userB.id,
      notification_type: 'comment',
      title: '新しいコメント',
      body: expect.stringContaining(userA.display_name),
      data: {
        postId: post.id,
        commentId: comment.id
      },
      is_read: false
    });

    // FCMトークンが存在する場合は配信も確認
    if (userB.fcm_token) {
      const deliveryLog = await supabase
        .from('notification_delivery_logs')
        .select('*')
        .eq('notification_id', notification.id)
        .single();

      expect(deliveryLog.data.status).toBe('delivered');
    }
  });

  test('フォロー時に理由付きで通知されること', async () => {
    const followReason = '音声配信が素晴らしいから';
    
    // フォロー実行
    const { data: follow } = await supabase
      .from('follows')
      .insert({
        follower_id: userA.id,
        followee_id: userB.id,
        follow_type: 'family',
        follow_reason: followReason
      })
      .select()
      .single();

    const notification = await waitForNotification({
      userId: userB.id,
      type: 'follow'
    });

    expect(notification.data.followReason).toBe(followReason);
    expect(notification.data.followType).toBe('family');
  });

  test('通知設定OFFの場合は通知されないこと', async () => {
    // ハイライト通知をOFFに
    await supabase
      .from('notification_settings')
      .update({ enabled: false })
      .eq('user_id', userB.id)
      .eq('notification_type', 'highlight');

    // ハイライト実行
    await supabase
      .from('highlights')
      .insert({
        post_id: post.id,
        user_id: userA.id,
        reason: 'とても感動しました'
      });

    // 通知が作成されないことを確認
    const notifications = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userB.id)
      .eq('notification_type', 'highlight')
      .gte('created_at', new Date(Date.now() - 5000).toISOString());

    expect(notifications.data).toHaveLength(0);
  });
});
```

### 4.2 リアルタイム通知

```typescript
// __tests__/integration/realtime-notification.test.ts
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

describe('Realtime Notification Integration', () => {
  let channel: RealtimeChannel;
  let userId: string;

  beforeEach(async () => {
    userId = 'test-user-id';
    
    // リアルタイムチャンネル購読
    channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // 通知受信処理
        }
      );

    await channel.subscribe();
  });

  afterEach(async () => {
    await channel.unsubscribe();
  });

  test('新規通知がリアルタイムで受信されること', async (done) => {
    const expectedNotification = {
      title: 'リアルタイムテスト',
      body: 'これはリアルタイム通知のテストです'
    };

    // リスナー設定
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        expect(payload.new).toMatchObject({
          user_id: userId,
          title: expectedNotification.title,
          body: expectedNotification.body
        });
        done();
      }
    );

    // 別のコネクションから通知を作成
    await createNotificationFromAnotherUser({
      userId,
      ...expectedNotification,
      type: 'comment'
    });
  });

  test('複数の通知が順番に受信されること', async () => {
    const receivedNotifications: any[] = [];
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      },
      (payload) => {
        receivedNotifications.push(payload.new);
      }
    );

    // 複数の通知を連続作成
    for (let i = 0; i < 3; i++) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: `通知 ${i + 1}`,
          body: `本文 ${i + 1}`,
          notification_type: 'comment',
          data: { index: i }
        });
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 待機
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(receivedNotifications).toHaveLength(3);
    expect(receivedNotifications[0].title).toBe('通知 1');
    expect(receivedNotifications[2].title).toBe('通知 3');
  });
});
```

## 5. E2Eテスト

### 5.1 通知受信から画面遷移まで

```typescript
// __tests__/e2e/notification-e2e.test.ts
import { device, element, by, expect as e2eExpect } from 'detox';

describe('Notification E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES' },
      newInstance: true
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('アプリ起動時に通知許可を求めること', async () => {
    // 初回起動をシミュレート
    await device.launchApp({
      delete: true,
      permissions: { notifications: 'unset' }
    });

    // 通知許可ダイアログが表示される
    await e2eExpect(element(by.text('通知を有効にしてください'))).toBeVisible();
    await element(by.id('enable-notifications')).tap();

    // OS許可ダイアログ（Detoxでは自動処理）
    await e2eExpect(element(by.text('通知が有効になりました'))).toBeVisible();
  });

  test('通知設定画面で設定を変更できること', async () => {
    // ログイン
    await loginAsTestUser();

    // 設定画面へ移動
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.text('通知設定')).tap();

    // 初期状態確認
    await e2eExpect(element(by.id('switch-comment'))).toHaveToggleValue(true);

    // コメント通知をOFF
    await element(by.id('switch-comment')).tap();
    await e2eExpect(element(by.id('switch-comment'))).toHaveToggleValue(false);

    // 保存確認
    await element(by.id('back-button')).tap();
    await element(by.text('通知設定')).tap();
    await e2eExpect(element(by.id('switch-comment'))).toHaveToggleValue(false);
  });

  test('プッシュ通知から投稿詳細へ遷移すること', async () => {
    await loginAsTestUser();

    // プッシュ通知をシミュレート
    await device.sendUserNotification({
      trigger: {
        type: 'push'
      },
      title: '新しいコメント',
      body: 'テストユーザーさんがコメントしました',
      payload: {
        type: 'comment',
        postId: 'test-post-id',
        notificationId: 'test-notification-id'
      }
    });

    // 通知をタップ
    await device.launchApp({ newInstance: false });

    // 投稿詳細画面が開く
    await e2eExpect(element(by.id('post-detail-screen'))).toBeVisible();
    await e2eExpect(element(by.id('post-id-test-post-id'))).toBeVisible();
  });

  test('アプリ内通知一覧から詳細へ遷移すること', async () => {
    await loginAsTestUser();

    // 通知一覧を開く
    await element(by.id('notification-icon')).tap();

    // 通知が表示される
    await e2eExpect(element(by.text('新しいコメント'))).toBeVisible();
    await e2eExpect(element(by.id('unread-indicator-0'))).toBeVisible();

    // 通知をタップ
    await element(by.id('notification-item-0')).tap();

    // 投稿詳細へ遷移
    await e2eExpect(element(by.id('post-detail-screen'))).toBeVisible();

    // 戻って既読確認
    await element(by.id('back-button')).tap();
    await e2eExpect(element(by.id('unread-indicator-0'))).not.toBeVisible();
  });

  test('フォロー通知からプロフィールへ遷移すること', async () => {
    await loginAsTestUser();

    // フォロー通知を作成
    await createTestNotification({
      type: 'follow',
      title: '新しいフォロワー',
      body: 'フォローテストさんがあなたをフォローしました',
      data: {
        followerId: 'follower-user-id',
        followType: 'family',
        followReason: 'コンテンツが素晴らしいから'
      }
    });

    // 通知一覧を開く
    await element(by.id('notification-icon')).tap();
    await element(by.text('新しいフォロワー')).tap();

    // プロフィール画面へ遷移
    await e2eExpect(element(by.id('profile-screen'))).toBeVisible();
    await e2eExpect(element(by.text('フォローテスト'))).toBeVisible();
  });

  test('バックグラウンドで受信した通知がバッジ表示されること', async () => {
    await loginAsTestUser();

    // アプリをバックグラウンドへ
    await device.sendToHome();

    // 通知を送信
    await createTestNotification({
      type: 'highlight',
      title: '投稿がハイライトされました'
    });

    // アプリを復帰
    await device.launchApp({ newInstance: false });

    // バッジが表示される
    await e2eExpect(element(by.id('notification-badge'))).toBeVisible();
    await e2eExpect(element(by.id('notification-badge'))).toHaveText('1');
  });

  test('すべて既読機能が動作すること', async () => {
    await loginAsTestUser();

    // 複数の未読通知を作成
    for (let i = 0; i < 3; i++) {
      await createTestNotification({
        type: 'comment',
        title: `コメント ${i + 1}`
      });
    }

    // 通知一覧を開く
    await element(by.id('notification-icon')).tap();
    await e2eExpect(element(by.id('notification-badge'))).toHaveText('3');

    // すべて既読
    await element(by.id('mark-all-read')).tap();

    // バッジが消える
    await e2eExpect(element(by.id('notification-badge'))).not.toBeVisible();

    // 通知アイテムも既読状態に
    await e2eExpect(element(by.id('unread-indicator-0'))).not.toBeVisible();
    await e2eExpect(element(by.id('unread-indicator-1'))).not.toBeVisible();
    await e2eExpect(element(by.id('unread-indicator-2'))).not.toBeVisible();
  });
});

// ヘルパー関数
async function loginAsTestUser() {
  await element(by.id('login-button')).tap();
  await element(by.id('email-input')).typeText('test@example.com');
  await element(by.id('password-input')).typeText('testpassword');
  await element(by.id('submit-button')).tap();
}

async function createTestNotification(notification: any) {
  // E2Eテスト用のAPIエンドポイントを使用
  await fetch('http://localhost:54321/functions/v1/test/create-notification', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testAuthToken}`
    },
    body: JSON.stringify(notification)
  });
}
```

### 5.2 通知配信エラーケース

```typescript
// __tests__/e2e/notification-error-e2e.test.ts
describe('Notification Error Handling E2E', () => {
  test('ネットワークエラー時の通知処理', async () => {
    await loginAsTestUser();

    // ネットワーク切断
    await device.disableSynchronization();
    await device.setURLBlacklist(['.*']);

    // 通知設定変更を試みる
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.text('通知設定')).tap();
    await element(by.id('switch-comment')).tap();

    // エラーメッセージ表示
    await e2eExpect(element(by.text('通信エラーが発生しました'))).toBeVisible();

    // ネットワーク復旧
    await device.setURLBlacklist([]);
    await device.enableSynchronization();

    // リトライ
    await element(by.id('retry-button')).tap();
    await e2eExpect(element(by.text('設定を保存しました'))).toBeVisible();
  });

  test('通知許可が拒否された場合の処理', async () => {
    // 通知許可を拒否してアプリ起動
    await device.launchApp({
      permissions: { notifications: 'NO' },
      delete: true
    });

    await loginAsTestUser();

    // 通知設定画面
    await element(by.id('tab-profile')).tap();
    await element(by.id('settings-button')).tap();
    await element(by.text('通知設定')).tap();

    // 警告メッセージ表示
    await e2eExpect(element(by.text('通知が無効になっています'))).toBeVisible();
    await e2eExpect(element(by.text('設定アプリから通知を有効にしてください'))).toBeVisible();

    // 設定アプリへのリンク
    await element(by.id('open-settings')).tap();
    // iOSの場合は設定アプリが開く
  });
});
```

## 6. パフォーマンステスト

```typescript
// __tests__/performance/notification-performance.test.ts
describe('Notification Performance Test', () => {
  test('大量通知の一覧表示パフォーマンス', async () => {
    const userId = 'perf-test-user';
    
    // 1000件の通知を作成
    const notifications = [];
    for (let i = 0; i < 1000; i++) {
      notifications.push({
        user_id: userId,
        title: `通知 ${i}`,
        body: `パフォーマンステスト通知 ${i}`,
        notification_type: ['comment', 'highlight', 'follow', 'gift'][i % 4],
        data: { index: i },
        is_read: i % 3 === 0
      });
    }

    await supabase.from('notifications').insert(notifications);

    // 取得パフォーマンス測定
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(error).toBeNull();
    expect(data).toHaveLength(20);
    expect(responseTime).toBeLessThan(500); // 500ms以内
  });

  test('リアルタイム通知の遅延測定', async (done) => {
    const userId = 'realtime-perf-test';
    let notificationTime: number;
    let receiveTime: number;

    const channel = supabase
      .channel(`perf-test:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          receiveTime = Date.now();
          const latency = receiveTime - notificationTime;
          
          expect(latency).toBeLessThan(100); // 100ms以内
          done();
        }
      );

    await channel.subscribe();

    // 通知作成
    notificationTime = Date.now();
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title: 'リアルタイムテスト',
        body: '遅延測定',
        notification_type: 'comment',
        data: {}
      });
  });
});
```

## 7. セキュリティテスト

```typescript
// __tests__/security/notification-security.test.ts
describe('Notification Security Test', () => {
  test('他ユーザーの通知にアクセスできないこと', async () => {
    const userA = await createTestUser('security-user-a');
    const userB = await createTestUser('security-user-b');

    // UserBの通知を作成
    const { data: notification } = await supabase
      .from('notifications')
      .insert({
        user_id: userB.id,
        title: 'プライベート通知',
        body: '他ユーザーには見えない',
        notification_type: 'comment',
        data: {}
      })
      .select()
      .single();

    // UserAとして通知にアクセス
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notification.id)
      .single();

    expect(error).toBeDefined();
    expect(error.code).toBe('42501'); // RLSポリシー違反
    expect(data).toBeNull();
  });

  test('通知設定の改竄ができないこと', async () => {
    const userA = await createTestUser('settings-security-a');
    const userB = await createTestUser('settings-security-b');

    // UserAがUserBの通知設定を変更しようとする
    const { error } = await supabase
      .from('notification_settings')
      .update({ enabled: false })
      .eq('user_id', userB.id)
      .eq('notification_type', 'comment');

    expect(error).toBeDefined();
    expect(error.code).toBe('42501');
  });

  test('FCMトークンのバリデーション', async () => {
    const invalidTokens = [
      '', // 空文字
      'a'.repeat(1000), // 長すぎる
      'invalid token with spaces',
      '<script>alert("xss")</script>',
      '"; DROP TABLE notifications; --'
    ];

    for (const token of invalidTokens) {
      const { error } = await supabase
        .from('profiles')
        .update({ fcm_token: token })
        .eq('id', 'test-user-id');

      expect(error).toBeDefined();
    }
  });
});
```

## 8. テストユーティリティ

```typescript
// test-utils/notification-helpers.ts
export async function createTestUser(username: string) {
  const { data: { user } } = await supabase.auth.signUp({
    email: `${username}@test.com`,
    password: 'testpassword123'
  });

  await supabase
    .from('profiles')
    .update({
      display_name: username,
      fcm_token: `test-token-${username}`
    })
    .eq('id', user.id);

  return user;
}

export async function enableNotifications(
  userId: string, 
  types: string[] = ['comment', 'highlight', 'follow', 'gift']
) {
  for (const type of types) {
    await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        notification_type: type,
        enabled: true
      });
  }
}

export async function waitForNotification(options: {
  userId: string;
  type?: string;
  timeout?: number;
}) {
  const { userId, type, timeout = 5000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (type) {
      query.eq('notification_type', type);
    }

    const { data } = await query.single();
    
    if (data) {
      return data;
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  throw new Error('Notification timeout');
}

export async function createTestPost(userId: string, post: any) {
  const { data } = await supabase
    .from('posts')
    .insert({
      user_id: userId,
      ...post
    })
    .select()
    .single();

  return data;
}
```

## 9. テスト実行設定

```json
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts'
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

```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';
import 'react-native-reanimated/mock';

// Supabase環境変数設定
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

// グローバルモック
global.fetch = jest.fn();
global.WebSocket = jest.fn();

// React Navigation モック
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn()
  }),
  useRoute: () => ({
    params: {}
  })
}));

// Expo Notifications モック（FCMの代替）
jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn()
}));
```
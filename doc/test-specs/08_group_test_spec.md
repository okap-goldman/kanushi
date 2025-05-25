# グループ機能テスト仕様書

## 概要
本書はグループ機能のTDD実装のための詳細なテスト仕様書です。
以下のテストライブラリを使用することを前提としています：

- jest-expo@~53.0.0
- @testing-library/react-native@^13
- @testing-library/jest-native@^6
- react-native-reanimated/mock
- モック使用は最小限に留める

## 1. API単体テスト

### 1.1 グループ作成API (`POST /groups`)

#### 1.1.1 正常系テスト

```typescript
describe('POST /groups', () => {
  it('無料グループを正常に作成できること', async () => {
    const groupData = {
      name: '目醒めの会',
      description: 'スピリチュアルな交流グループ',
      type: 'free',
      is_public: true,
      member_limit: 50
    };

    const response = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <valid-token>')
      .send(groupData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: groupData.name,
      type: 'free',
      owner_id: expect.any(String),
      member_count: 1,
      created_at: expect.any(String)
    });
  });

  it('有料グループを正常に作成できること', async () => {
    const groupData = {
      name: '高次元チャネリング講座',
      description: '月額制のチャネリング学習グループ',
      type: 'subscription',
      subscription_price: 3000,
      is_public: false,
      member_limit: 30
    };

    const response = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <valid-token>')
      .send(groupData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      name: groupData.name,
      type: 'subscription',
      subscription_price: 3000,
      payment_url: expect.stringContaining('stores.jp'),
      owner_id: expect.any(String)
    });
  });
});
```

#### 1.1.2 異常系テスト

```typescript
describe('POST /groups - エラーケース', () => {
  it('認証なしの場合401エラーを返すこと', async () => {
    const response = await request(app)
      .post('/groups')
      .send({ name: 'テストグループ' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Unauthorized');
  });

  it('必須フィールドが不足している場合400エラーを返すこと', async () => {
    const response = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <valid-token>')
      .send({ description: '説明のみ' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('name is required');
  });

  it('有料グループで価格が未設定の場合400エラーを返すこと', async () => {
    const response = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <valid-token>')
      .send({
        name: '有料グループ',
        type: 'subscription'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('subscription_price is required');
  });

  it('メンバー上限が100を超える場合400エラーを返すこと', async () => {
    const response = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <valid-token>')
      .send({
        name: 'テストグループ',
        member_limit: 101
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('member_limit cannot exceed 100');
  });
});
```

### 1.2 グループ参加API (`POST /groups/{groupId}/join`)

#### 1.2.1 正常系テスト

```typescript
describe('POST /groups/{groupId}/join', () => {
  it('無料グループに正常に参加できること', async () => {
    const groupId = 'test-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      group_id: groupId,
      user_id: expect.any(String),
      role: 'member',
      status: 'active',
      joined_at: expect.any(String)
    });
  });

  it('有料グループの参加で支払いURLを返すこと', async () => {
    const groupId = 'paid-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      requires_payment: true,
      payment_url: expect.stringContaining('stores.jp'),
      group_id: groupId
    });
  });
});
```

#### 1.2.2 異常系テスト

```typescript
describe('POST /groups/{groupId}/join - エラーケース', () => {
  it('既に参加している場合409エラーを返すこと', async () => {
    const groupId = 'already-member-group';
    
    const response = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Already a member');
  });

  it('グループが満員の場合403エラーを返すこと', async () => {
    const groupId = 'full-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Group is full');
  });

  it('存在しないグループの場合404エラーを返すこと', async () => {
    const response = await request(app)
      .post('/groups/non-existent-id/join')
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Group not found');
  });

  it('非公開グループへの直接参加は403エラーを返すこと', async () => {
    const groupId = 'private-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <valid-token>');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('This is a private group');
  });
});
```

### 1.3 グループチャットAPI (`POST /groups/{groupId}/messages`)

#### 1.3.1 正常系テスト

```typescript
describe('POST /groups/{groupId}/messages', () => {
  it('テキストメッセージを正常に送信できること', async () => {
    const groupId = 'test-group-id';
    const messageData = {
      content: '今日も良い一日を！',
      type: 'text'
    };

    const response = await request(app)
      .post(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <valid-token>')
      .send(messageData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(String),
      group_id: groupId,
      sender_id: expect.any(String),
      content: messageData.content,
      type: 'text',
      created_at: expect.any(String)
    });
  });

  it('画像メッセージを正常に送信できること', async () => {
    const groupId = 'test-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <valid-token>')
      .attach('media', 'test/fixtures/test-image.jpg')
      .field('type', 'image')
      .field('content', 'エネルギーワークの様子');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      type: 'image',
      media_url: expect.stringContaining('b2.backblazeb2.com'),
      content: 'エネルギーワークの様子'
    });
  });

  it('音声メッセージを正常に送信できること', async () => {
    const groupId = 'test-group-id';
    
    const response = await request(app)
      .post(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <valid-token>')
      .attach('media', 'test/fixtures/test-audio.m4a')
      .field('type', 'audio')
      .field('duration', '45');

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      type: 'audio',
      media_url: expect.stringContaining('b2.backblazeb2.com'),
      duration: 45
    });
  });
});
```

### 1.4 メンバー管理API (`DELETE /groups/{groupId}/members/{memberId}`)

#### 1.4.1 正常系テスト

```typescript
describe('DELETE /groups/{groupId}/members/{memberId}', () => {
  it('オーナーがメンバーを正常に削除できること', async () => {
    const groupId = 'test-group-id';
    const memberId = 'member-to-remove';

    const response = await request(app)
      .delete(`/groups/${groupId}/members/${memberId}`)
      .set('Authorization', 'Bearer <owner-token>');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: 'Member removed successfully',
      removed_member_id: memberId
    });
  });
});
```

#### 1.4.2 異常系テスト

```typescript
describe('DELETE /groups/{groupId}/members/{memberId} - エラーケース', () => {
  it('非オーナーがメンバー削除を試みた場合403エラーを返すこと', async () => {
    const response = await request(app)
      .delete('/groups/test-group/members/some-member')
      .set('Authorization', 'Bearer <member-token>');

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Only group owner can remove members');
  });

  it('オーナー自身を削除しようとした場合400エラーを返すこと', async () => {
    const response = await request(app)
      .delete('/groups/test-group/members/owner-id')
      .set('Authorization', 'Bearer <owner-token>');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Cannot remove group owner');
  });
});
```

## 2. UI単体テスト

### 2.1 グループ作成画面

```typescript
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateGroupScreen } from '@/screens/CreateGroupScreen';

describe('CreateGroupScreen', () => {
  it('グループ作成フォームが正しく表示されること', () => {
    const { getByPlaceholderText, getByText } = render(<CreateGroupScreen />);

    expect(getByPlaceholderText('グループ名')).toBeDefined();
    expect(getByPlaceholderText('グループの説明')).toBeDefined();
    expect(getByText('無料グループ')).toBeDefined();
    expect(getByText('有料グループ')).toBeDefined();
    expect(getByText('作成')).toBeDefined();
  });

  it('無料グループを作成できること', async () => {
    const mockNavigation = { navigate: jest.fn() };
    const { getByPlaceholderText, getByText } = render(
      <CreateGroupScreen navigation={mockNavigation} />
    );

    fireEvent.changeText(getByPlaceholderText('グループ名'), '瞑想サークル');
    fireEvent.changeText(getByPlaceholderText('グループの説明'), '毎日瞑想を実践する仲間');
    fireEvent.press(getByText('無料グループ'));
    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(mockNavigation.navigate).toHaveBeenCalledWith('GroupDetail', {
        groupId: expect.any(String)
      });
    });
  });

  it('有料グループ選択時に価格入力フィールドが表示されること', () => {
    const { getByText, queryByPlaceholderText } = render(<CreateGroupScreen />);

    expect(queryByPlaceholderText('月額料金（円）')).toBeNull();

    fireEvent.press(getByText('有料グループ'));

    expect(queryByPlaceholderText('月額料金（円）')).toBeDefined();
  });

  it('必須項目が未入力の場合エラーが表示されること', async () => {
    const { getByText } = render(<CreateGroupScreen />);

    fireEvent.press(getByText('作成'));

    await waitFor(() => {
      expect(getByText('グループ名は必須です')).toBeDefined();
    });
  });
});
```

### 2.2 グループ詳細画面

```typescript
describe('GroupDetailScreen', () => {
  const mockGroup = {
    id: 'test-group-1',
    name: 'スピリチュアル交流会',
    description: '精神世界について語り合うグループ',
    type: 'free',
    member_count: 25,
    member_limit: 100,
    is_member: false
  };

  it('グループ情報が正しく表示されること', () => {
    const { getByText } = render(
      <GroupDetailScreen route={{ params: { groupId: mockGroup.id } }} />
    );

    expect(getByText(mockGroup.name)).toBeDefined();
    expect(getByText(mockGroup.description)).toBeDefined();
    expect(getByText(`${mockGroup.member_count}/${mockGroup.member_limit} メンバー`)).toBeDefined();
  });

  it('未参加の場合参加ボタンが表示されること', () => {
    const { getByText } = render(
      <GroupDetailScreen route={{ params: { groupId: mockGroup.id } }} />
    );

    expect(getByText('参加する')).toBeDefined();
  });

  it('参加済みの場合チャット画面へのボタンが表示されること', () => {
    const memberGroup = { ...mockGroup, is_member: true };
    
    const { getByText, queryByText } = render(
      <GroupDetailScreen route={{ params: { groupId: memberGroup.id } }} />
    );

    expect(queryByText('参加する')).toBeNull();
    expect(getByText('チャット')).toBeDefined();
    expect(getByText('退出')).toBeDefined();
  });
});
```

### 2.3 グループチャット画面

```typescript
describe('GroupChatScreen', () => {
  it('メッセージ入力フィールドが表示されること', () => {
    const { getByPlaceholderText, getByTestId } = render(
      <GroupChatScreen route={{ params: { groupId: 'test-group' } }} />
    );

    expect(getByPlaceholderText('メッセージを入力...')).toBeDefined();
    expect(getByTestId('send-button')).toBeDefined();
    expect(getByTestId('image-button')).toBeDefined();
    expect(getByTestId('audio-button')).toBeDefined();
  });

  it('テキストメッセージを送信できること', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <GroupChatScreen route={{ params: { groupId: 'test-group' } }} />
    );

    const input = getByPlaceholderText('メッセージを入力...');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, 'こんにちは！');
    fireEvent.press(sendButton);

    await waitFor(() => {
      expect(input.props.value).toBe('');
    });
  });

  it('画像選択モーダルが開くこと', () => {
    const { getByTestId, getByText } = render(
      <GroupChatScreen route={{ params: { groupId: 'test-group' } }} />
    );

    fireEvent.press(getByTestId('image-button'));

    expect(getByText('カメラで撮影')).toBeDefined();
    expect(getByText('ギャラリーから選択')).toBeDefined();
  });

  it('メッセージリストが正しく表示されること', async () => {
    const mockMessages = [
      { id: '1', content: 'おはようございます', sender: { name: 'ユーザーA' } },
      { id: '2', content: '今日も良い一日を！', sender: { name: 'ユーザーB' } }
    ];

    const { getByText } = render(
      <GroupChatScreen route={{ params: { groupId: 'test-group' } }} />
    );

    await waitFor(() => {
      expect(getByText('おはようございます')).toBeDefined();
      expect(getByText('今日も良い一日を！')).toBeDefined();
      expect(getByText('ユーザーA')).toBeDefined();
      expect(getByText('ユーザーB')).toBeDefined();
    });
  });
});
```

### 2.4 メンバー管理画面

```typescript
describe('GroupMembersScreen', () => {
  it('メンバーリストが表示されること', async () => {
    const mockMembers = [
      { id: '1', name: '山田太郎', role: 'owner' },
      { id: '2', name: '佐藤花子', role: 'member' }
    ];

    const { getByText } = render(
      <GroupMembersScreen route={{ params: { groupId: 'test-group' } }} />
    );

    await waitFor(() => {
      expect(getByText('山田太郎')).toBeDefined();
      expect(getByText('オーナー')).toBeDefined();
      expect(getByText('佐藤花子')).toBeDefined();
    });
  });

  it('オーナーの場合メンバー削除ボタンが表示されること', async () => {
    const { getAllByTestId } = render(
      <GroupMembersScreen 
        route={{ params: { groupId: 'test-group', isOwner: true } }} 
      />
    );

    await waitFor(() => {
      const removeButtons = getAllByTestId('remove-member-button');
      expect(removeButtons.length).toBeGreaterThan(0);
    });
  });

  it('メンバー削除確認ダイアログが表示されること', async () => {
    const { getByTestId, getByText } = render(
      <GroupMembersScreen 
        route={{ params: { groupId: 'test-group', isOwner: true } }} 
      />
    );

    await waitFor(() => {
      const removeButton = getByTestId('remove-member-button');
      fireEvent.press(removeButton);
    });

    expect(getByText('メンバーを削除しますか？')).toBeDefined();
    expect(getByText('この操作は取り消せません')).toBeDefined();
  });
});
```

## 3. 統合テスト

### 3.1 グループ作成から参加までのフロー

```typescript
describe('グループ作成・参加フロー統合テスト', () => {
  it('無料グループの作成から参加までの完全なフローが動作すること', async () => {
    // 1. グループ作成
    const createResponse = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <creator-token>')
      .send({
        name: '統合テストグループ',
        description: 'テスト用グループ',
        type: 'free'
      });

    expect(createResponse.status).toBe(201);
    const groupId = createResponse.body.id;

    // 2. 作成者がオーナーとして登録されていることを確認
    const membersResponse = await request(app)
      .get(`/groups/${groupId}/members`)
      .set('Authorization', 'Bearer <creator-token>');

    expect(membersResponse.body.members).toContainEqual(
      expect.objectContaining({
        role: 'owner',
        status: 'active'
      })
    );

    // 3. 別のユーザーがグループに参加
    const joinResponse = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <member-token>');

    expect(joinResponse.status).toBe(200);

    // 4. メンバー数が増えていることを確認
    const groupResponse = await request(app)
      .get(`/groups/${groupId}`)
      .set('Authorization', 'Bearer <member-token>');

    expect(groupResponse.body.member_count).toBe(2);
  });

  it('有料グループの作成から決済完了までのフローが動作すること', async () => {
    // 1. 有料グループ作成
    const createResponse = await request(app)
      .post('/groups')
      .set('Authorization', 'Bearer <creator-token>')
      .send({
        name: '有料テストグループ',
        type: 'subscription',
        subscription_price: 1000
      });

    const groupId = createResponse.body.id;
    const paymentUrl = createResponse.body.payment_url;

    // 2. 参加リクエスト
    const joinResponse = await request(app)
      .post(`/groups/${groupId}/join`)
      .set('Authorization', 'Bearer <member-token>');

    expect(joinResponse.body.requires_payment).toBe(true);
    expect(joinResponse.body.payment_url).toBeDefined();

    // 3. 決済Webhookシミュレーション
    const webhookResponse = await request(app)
      .post('/webhooks/stores-payment')
      .send({
        event: 'payment.completed',
        order_id: 'test-order-123',
        user_id: 'member-user-id',
        group_id: groupId
      });

    expect(webhookResponse.status).toBe(200);

    // 4. メンバーとして登録されていることを確認
    const memberCheckResponse = await request(app)
      .get(`/groups/${groupId}/members`)
      .set('Authorization', 'Bearer <member-token>');

    expect(memberCheckResponse.body.members).toContainEqual(
      expect.objectContaining({
        user_id: 'member-user-id',
        status: 'active'
      })
    );
  });
});
```

### 3.2 グループチャット統合テスト

```typescript
describe('グループチャット統合テスト', () => {
  it('メッセージ送信から通知までの完全なフローが動作すること', async () => {
    const groupId = 'chat-test-group';
    
    // 1. メッセージ送信
    const messageResponse = await request(app)
      .post(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <sender-token>')
      .send({
        content: '統合テストメッセージ',
        type: 'text'
      });

    expect(messageResponse.status).toBe(201);
    const messageId = messageResponse.body.id;

    // 2. メッセージ一覧で確認
    const messagesResponse = await request(app)
      .get(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <member-token>');

    expect(messagesResponse.body.messages).toContainEqual(
      expect.objectContaining({
        id: messageId,
        content: '統合テストメッセージ'
      })
    );

    // 3. 通知が作成されていることを確認
    const notificationsResponse = await request(app)
      .get('/notifications')
      .set('Authorization', 'Bearer <member-token>');

    expect(notificationsResponse.body.notifications).toContainEqual(
      expect.objectContaining({
        type: 'group_message',
        group_id: groupId,
        message_id: messageId
      })
    );
  });

  it('画像アップロードを含むメッセージ送信が動作すること', async () => {
    const groupId = 'chat-test-group';
    
    // 1. 画像付きメッセージ送信
    const messageResponse = await request(app)
      .post(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <sender-token>')
      .attach('media', 'test/fixtures/test-image.jpg')
      .field('type', 'image')
      .field('content', '画像のキャプション');

    expect(messageResponse.status).toBe(201);
    expect(messageResponse.body.media_url).toContain('b2.backblazeb2.com');

    // 2. 画像URLが有効であることを確認
    const imageResponse = await fetch(messageResponse.body.media_url);
    expect(imageResponse.status).toBe(200);
  });
});
```

### 3.3 メンバー管理統合テスト

```typescript
describe('メンバー管理統合テスト', () => {
  it('メンバー削除から退出通知までのフローが動作すること', async () => {
    const groupId = 'member-test-group';
    const targetMemberId = 'member-to-remove';

    // 1. メンバー削除
    const removeResponse = await request(app)
      .delete(`/groups/${groupId}/members/${targetMemberId}`)
      .set('Authorization', 'Bearer <owner-token>');

    expect(removeResponse.status).toBe(200);

    // 2. メンバーステータスが変更されていることを確認
    const membersResponse = await request(app)
      .get(`/groups/${groupId}/members`)
      .set('Authorization', 'Bearer <owner-token>');

    const removedMember = membersResponse.body.members.find(
      m => m.user_id === targetMemberId
    );
    expect(removedMember.status).toBe('removed');

    // 3. 削除されたメンバーがアクセスできないことを確認
    const accessResponse = await request(app)
      .get(`/groups/${groupId}/messages`)
      .set('Authorization', 'Bearer <removed-member-token>');

    expect(accessResponse.status).toBe(403);

    // 4. 通知が送信されていることを確認
    const notificationResponse = await request(app)
      .get('/notifications')
      .set('Authorization', 'Bearer <removed-member-token>');

    expect(notificationResponse.body.notifications).toContainEqual(
      expect.objectContaining({
        type: 'group_removed',
        group_id: groupId
      })
    );
  });
});
```

## 4. E2Eテスト

### 4.1 グループ作成から投稿までの完全なユーザージャーニー

```typescript
describe('グループ機能E2Eテスト', () => {
  it('ユーザーがグループを作成し、メンバーが参加してチャットするまでの完全なフロー', async () => {
    // 1. アプリ起動とログイン
    await device.launchApp();
    await element(by.id('email-input')).typeText('creator@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    // 2. グループ作成画面への遷移
    await element(by.id('bottom-tab-groups')).tap();
    await element(by.id('create-group-button')).tap();

    // 3. グループ情報入力
    await element(by.id('group-name-input')).typeText('E2Eテストグループ');
    await element(by.id('group-description-input')).typeText('自動テスト用のグループです');
    await element(by.id('group-type-free')).tap();
    await element(by.id('member-limit-slider')).swipeTo(50);

    // 4. グループ作成
    await element(by.id('create-button')).tap();
    await waitFor(element(by.id('group-detail-screen'))).toBeVisible().withTimeout(5000);

    // 5. グループIDを取得（実際のE2Eではスキップ可能）
    const groupNameElement = element(by.id('group-name-text'));
    await expect(groupNameElement).toHaveText('E2Eテストグループ');

    // 6. 別のユーザーでログインして参加
    await device.launchApp({ delete: true });
    await element(by.id('email-input')).typeText('member@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    // 7. グループ検索と参加
    await element(by.id('bottom-tab-groups')).tap();
    await element(by.id('search-groups-input')).typeText('E2Eテストグループ');
    await element(by.id('group-item-0')).tap();
    await element(by.id('join-group-button')).tap();

    // 8. チャット画面でメッセージ送信
    await element(by.id('group-chat-button')).tap();
    await element(by.id('message-input')).typeText('E2Eテストから送信');
    await element(by.id('send-button')).tap();

    // 9. メッセージが表示されることを確認
    await waitFor(element(by.text('E2Eテストから送信')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('有料グループの決済フローが正しく動作すること', async () => {
    // 1. 有料グループ作成
    await device.launchApp();
    await element(by.id('email-input')).typeText('creator@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    await element(by.id('bottom-tab-groups')).tap();
    await element(by.id('create-group-button')).tap();

    await element(by.id('group-name-input')).typeText('有料E2Eグループ');
    await element(by.id('group-type-subscription')).tap();
    await element(by.id('subscription-price-input')).typeText('1500');
    await element(by.id('create-button')).tap();

    // 2. 別ユーザーで参加試行
    await device.launchApp({ delete: true });
    await element(by.id('email-input')).typeText('member@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    await element(by.id('bottom-tab-groups')).tap();
    await element(by.id('search-groups-input')).typeText('有料E2Eグループ');
    await element(by.id('group-item-0')).tap();
    await element(by.id('join-group-button')).tap();

    // 3. 決済画面が表示されることを確認
    await waitFor(element(by.id('payment-webview')))
      .toBeVisible()
      .withTimeout(5000);
    
    await expect(element(by.text('月額 ¥1,500'))).toBeVisible();
  });
});
```

### 4.2 グループメンバー管理E2Eテスト

```typescript
describe('グループメンバー管理E2Eテスト', () => {
  it('オーナーがメンバーを削除できること', async () => {
    // 1. オーナーとしてログイン
    await device.launchApp();
    await element(by.id('email-input')).typeText('owner@example.com');
    await element(by.id('password-input')).typeText('password');
    await element(by.id('login-button')).tap();

    // 2. グループ詳細画面へ
    await element(by.id('bottom-tab-groups')).tap();
    await element(by.id('my-groups-tab')).tap();
    await element(by.id('group-item-0')).tap();

    // 3. メンバー管理画面へ
    await element(by.id('members-button')).tap();

    // 4. メンバーを削除
    await element(by.id('member-item-1')).swipe('left');
    await element(by.id('remove-button')).tap();
    await element(by.id('confirm-remove-button')).tap();

    // 5. メンバーが削除されたことを確認
    await expect(element(by.id('member-item-1'))).not.toBeVisible();
  });
});
```

## テスト実行設定

### Jest設定 (jest.config.js)

```javascript
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testEnvironment: 'node',
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

### テストセットアップ (jest.setup.js)

```javascript
// React Native Reanimatedのモック
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// React Native Gesture Handlerのモック
jest.mock('react-native-gesture-handler', () => ({
  Swipeable: jest.fn().mockImplementation(({ children }) => children),
  State: {},
  PanGestureHandler: jest.fn().mockImplementation(({ children }) => children),
  BaseButton: jest.fn().mockImplementation(({ children }) => children),
  RectButton: jest.fn().mockImplementation(({ children }) => children),
}));

// AsyncStorageのモック
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// グローバルなfetchのモック
global.fetch = jest.fn();

// タイマーのモック
jest.useFakeTimers();
```

## まとめ

本テスト仕様書は、グループ機能のTDD実装に必要な全てのテストケースを網羅しています。

### テストの優先順位

1. **最優先**: API単体テスト（基本的な機能の動作保証）
2. **高優先**: UI単体テスト（ユーザーインターフェースの正確性）
3. **中優先**: 統合テスト（機能間の連携確認）
4. **低優先**: E2Eテスト（完全なユーザーフローの検証）

### カバレッジ目標

- 単体テスト: 90%以上
- 統合テスト: 80%以上
- E2Eテスト: 主要なユーザーフローを網羅

### 実装時の注意点

1. モックは最小限に留め、実際のAPIやデータベースとの連携を重視
2. 非同期処理は必ず`waitFor`を使用して適切に待機
3. エラーケースは全て網羅し、適切なエラーメッセージを検証
4. テストデータは現実的な値を使用し、境界値テストも含める

これらのテストを実装することで、グループ機能の品質を保証し、安定したリリースを実現できます。
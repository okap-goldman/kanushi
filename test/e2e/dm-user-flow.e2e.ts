import { by, device, element, expect as detoxExpect } from 'detox';

describe('E2E: ダイレクトメッセージ機能', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('DM基本フロー - スレッド作成からメッセージ送信まで', async () => {
    // ログイン
    await loginAsTestUser('user1@example.com', 'password123');

    // DMタブに移動
    await element(by.id('dm-tab')).tap();
    await detoxExpect(element(by.id('message-list-screen'))).toBeVisible();

    // 新規メッセージボタンをタップ
    await element(by.id('new-dm-button')).tap();
    
    // ユーザー選択画面が表示される
    await detoxExpect(element(by.id('user-select-screen'))).toBeVisible();
    
    // ユーザーを検索
    await element(by.id('user-search-input')).typeText('user2');
    await element(by.id('user-item-user2')).tap();
    
    // 会話画面に遷移
    await detoxExpect(element(by.id('message-detail-screen'))).toBeVisible();
    await detoxExpect(element(by.text('User 2'))).toBeVisible();
    
    // メッセージを入力して送信
    await element(by.id('message-input')).typeText('こんにちは、これはテストメッセージです。');
    await element(by.id('send-button')).tap();
    
    // 送信したメッセージが表示される
    await detoxExpect(element(by.text('こんにちは、これはテストメッセージです。'))).toBeVisible();
    
    // 戻るボタンをタップ
    await element(by.id('back-button')).tap();
    
    // スレッド一覧に戻り、新しいスレッドが表示される
    await detoxExpect(element(by.id('message-list-screen'))).toBeVisible();
    await detoxExpect(element(by.text('User 2'))).toBeVisible();
    await detoxExpect(element(by.text('こんにちは、これはテストメッセージです。'))).toBeVisible();
  });

  test('画像送信と表示', async () => {
    // ログイン
    await loginAsTestUser('user1@example.com', 'password123');

    // DMタブに移動して既存のスレッドを開く
    await element(by.id('dm-tab')).tap();
    await element(by.text('User 2')).tap();
    
    // 画像添付ボタンをタップ
    await element(by.id('attach-image-button')).tap();
    
    // システム画像選択画面が表示される
    // Note: 実際のテスト環境ではOSのネイティブUIをテストする方法が必要
    // このテストではモックの画像選択を使用
    await mockSelectImage('test-image.jpg');
    
    // 選択した画像がプレビュー表示される
    await detoxExpect(element(by.id('image-preview'))).toBeVisible();
    
    // キャプションを追加して送信
    await element(by.id('message-input')).typeText('画像を送ります');
    await element(by.id('send-button')).tap();
    
    // 送信した画像が表示される
    await detoxExpect(element(by.id('message-image'))).toBeVisible();
    await detoxExpect(element(by.text('画像を送ります'))).toBeVisible();
    
    // 画像をタップして拡大表示
    await element(by.id('message-image')).tap();
    
    // 画像拡大ビューワーが表示される
    await detoxExpect(element(by.id('image-viewer'))).toBeVisible();
    
    // 閉じるボタンをタップ
    await element(by.id('close-image-viewer')).tap();
    
    // 会話画面に戻る
    await detoxExpect(element(by.id('message-detail-screen'))).toBeVisible();
  });

  test('長時間の会話履歴とスクロール', async () => {
    // ログイン
    await loginAsTestUser('user1@example.com', 'password123');

    // DMタブに移動して多数のメッセージがあるスレッドを開く
    await element(by.id('dm-tab')).tap();
    await element(by.text('Long Conversation')).tap();
    
    // 会話画面に多数のメッセージが表示される
    await detoxExpect(element(by.id('message-detail-screen'))).toBeVisible();
    
    // 最新のメッセージが表示されることを確認
    await detoxExpect(element(by.text('最新のメッセージ'))).toBeVisible();
    
    // 過去のメッセージを表示するためにスクロールアップ
    await element(by.id('message-list')).swipe('down', 'slow', 0.5);
    await element(by.id('message-list')).swipe('down', 'slow', 0.5);
    
    // 古いメッセージが表示されることを確認
    await detoxExpect(element(by.text('古いメッセージ'))).toBeVisible();
    
    // 「最新へ」ボタンをタップ
    await element(by.id('scroll-to-bottom')).tap();
    
    // 最新のメッセージ位置にスクロールされることを確認
    await detoxExpect(element(by.text('最新のメッセージ'))).toBeVisible();
  });

  test('スレッド検索と管理', async () => {
    // ログイン
    await loginAsTestUser('user1@example.com', 'password123');

    // DMタブに移動
    await element(by.id('dm-tab')).tap();
    
    // 検索ボックスに入力
    await element(by.id('thread-search')).typeText('admin');
    
    // 検索結果が表示される
    await detoxExpect(element(by.text('Admin User'))).toBeVisible();
    
    // 検索をクリア
    await element(by.id('clear-search')).tap();
    
    // スレッドをロングプレス
    await element(by.text('User 2')).longPress();
    
    // アクションメニューが表示される
    await detoxExpect(element(by.text('スレッドをアーカイブ'))).toBeVisible();
    await detoxExpect(element(by.text('ユーザーをブロック'))).toBeVisible();
    
    // アーカイブを選択
    await element(by.text('スレッドをアーカイブ')).tap();
    
    // 確認ダイアログが表示される
    await detoxExpect(element(by.text('このスレッドをアーカイブしますか？'))).toBeVisible();
    
    // 確認
    await element(by.text('アーカイブ')).tap();
    
    // スレッドが一覧から消えることを確認
    await detoxExpect(element(by.text('User 2'))).not.toExist();
    
    // アーカイブ済みスレッドを表示
    await element(by.id('show-archived')).tap();
    
    // アーカイブ済みスレッドが表示される
    await detoxExpect(element(by.text('User 2'))).toBeVisible();
    
    // アーカイブ済みスレッドを復元
    await element(by.text('User 2')).longPress();
    await element(by.text('スレッドを復元')).tap();
    
    // 通常の一覧に戻る
    await element(by.id('show-active')).tap();
    
    // 復元されたスレッドが表示されることを確認
    await detoxExpect(element(by.text('User 2'))).toBeVisible();
  });

  test('通知とリアルタイムメッセージ受信', async () => {
    // テスト用の2つのデバイスを準備
    const device1 = device; // 現在のデバイス
    const device2 = getSecondaryDevice(); // 2台目のデバイス（実際の実装では複数デバイスのセットアップが必要）
    
    // デバイス1: User1としてログイン
    await loginAsTestUser('user1@example.com', 'password123');
    
    // デバイス2: User2としてログイン
    await device2.launchApp();
    await loginAsTestUser('user2@example.com', 'password456', device2);
    
    // デバイス1: DMタブに移動
    await element(by.id('dm-tab')).tap();
    
    // デバイス2: User1とのスレッドを開く
    await element(by.id('dm-tab'), device2).tap();
    await element(by.text('User 1'), device2).tap();
    
    // デバイス2: メッセージを送信
    await element(by.id('message-input'), device2).typeText('こんにちは、User1さん');
    await element(by.id('send-button'), device2).tap();
    
    // デバイス1: 通知が表示される
    await detoxExpect(element(by.text('新しいメッセージ'))).toBeVisible();
    await detoxExpect(element(by.text('User 2: こんにちは、User1さん'))).toBeVisible();
    
    // デバイス1: 通知をタップ
    await element(by.text('新しいメッセージ')).tap();
    
    // デバイス1: 該当のスレッドが開くことを確認
    await detoxExpect(element(by.id('message-detail-screen'))).toBeVisible();
    await detoxExpect(element(by.text('User 2'))).toBeVisible();
    await detoxExpect(element(by.text('こんにちは、User1さん'))).toBeVisible();
    
    // デバイス1: 返信を送信
    await element(by.id('message-input')).typeText('こんにちは、User2さん');
    await element(by.id('send-button')).tap();
    
    // デバイス2: リアルタイムにメッセージが表示される
    await detoxExpect(element(by.text('こんにちは、User2さん'), device2)).toBeVisible();
  });
});

// テスト用ヘルパー関数
async function loginAsTestUser(email, password, targetDevice = device) {
  await element(by.id('email-input'), targetDevice).typeText(email);
  await element(by.id('password-input'), targetDevice).typeText(password);
  await element(by.id('login-button'), targetDevice).tap();
  await detoxExpect(element(by.id('home-screen'), targetDevice)).toBeVisible();
}

async function mockSelectImage(imageName) {
  // ここでは画像選択をモックする
  // 実際のテストでは、OSネイティブの選択UIをテストするか、
  // 画像選択のモックを使用する
  console.log(`Mocking image selection: ${imageName}`);
}

function getSecondaryDevice() {
  // 実際のテストでは複数デバイスのセットアップが必要
  // ここではモックとして同じデバイスを返す
  return device;
}
import { by, device, element, expect as detoxExpect } from 'detox';

describe('E2E: ライブルーム機能', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('ライブルームの完全なユーザーフロー', async () => {
    // ユーザー1（ホスト）としてログイン
    await loginAsTestUser('host@example.com', 'password123');

    // ホーム画面からライブルーム作成ボタンをタップ
    await element(by.id('create-liveroom-button')).tap();

    // ルーム作成ダイアログが表示される
    await detoxExpect(element(by.text('ライブルーム作成'))).toBeVisible();

    // ルーム情報を入力
    await element(by.id('room-title-input')).typeText('目醒めのトークルーム');
    await element(by.id('increase-speakers-button')).tap(); // 登壇者数を6に
    await element(by.id('recording-switch')).tap(); // 録音をオン

    // 作成ボタンをタップ
    await element(by.id('create-room-button')).tap();

    // マイク権限リクエストが表示される
    await detoxExpect(element(by.text('マイクへのアクセスを許可してください'))).toBeVisible();
    await element(by.text('許可する')).tap();

    // ルーム画面が表示される
    await detoxExpect(element(by.text('目醒めのトークルーム'))).toBeVisible();
    await detoxExpect(element(by.id('mic-button'))).toBeVisible();
    await detoxExpect(element(by.id('participants-tab'))).toBeVisible();
    await detoxExpect(element(by.id('chat-tab'))).toBeVisible();

    // 参加者タブを確認
    await element(by.id('participants-tab')).tap();
    await detoxExpect(element(by.id('host-badge'))).toBeVisible();

    // マイクをミュート/アンミュート
    await element(by.id('mic-button')).tap();
    await detoxExpect(element(by.id('mic-button'))).toHaveToggleValue(true);
    await element(by.id('mic-button')).tap();
    await detoxExpect(element(by.id('mic-button'))).toHaveToggleValue(false);

    // チャットタブに切り替え
    await element(by.id('chat-tab')).tap();
    await detoxExpect(element(by.id('chat-input'))).toBeVisible();

    // メッセージを送信
    await element(by.id('chat-input')).typeText('ようこそ、目醒めのトークルームへ！');
    await element(by.id('send-button')).tap();

    // メッセージが表示される
    await detoxExpect(element(by.text('ようこそ、目醒めのトークルームへ！'))).toBeVisible();

    // ここでユーザー2（リスナー）の操作を別のデバイスでシミュレート
    await simulateListenerJoining('listener@example.com', 'password123');

    // ホストとして、参加者タブで新しい参加者を確認
    await element(by.id('participants-tab')).tap();
    await detoxExpect(element(by.text('リスナー'))).toBeVisible();

    // 登壇リクエストが来たことをシミュレート
    await simulateSpeakerRequest('リスナー');

    // 登壇リクエストを承認
    await detoxExpect(element(by.text('登壇をリクエスト中'))).toBeVisible();
    await element(by.id('approve-request-button')).tap();

    // リスナーが登壇者になったことを確認
    await detoxExpect(element(by.id('speaker-badge-listener'))).toBeVisible();

    // ルーム終了処理
    await element(by.id('room-menu-button')).tap();
    await element(by.text('ルームを終了')).tap();
    
    // 確認ダイアログ
    await detoxExpect(element(by.text('ルームを終了しますか？'))).toBeVisible();
    await element(by.text('終了する')).tap();

    // ホーム画面に戻る
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // ルーム録音が保存されたことを確認
    await element(by.id('profile-tab')).tap();
    await element(by.text('録音済みルーム')).tap();
    await detoxExpect(element(by.text('目醒めのトークルーム'))).toBeVisible();
  });

  test('接続の問題と回復フロー', async () => {
    // ユーザーとしてログイン
    await loginAsTestUser('user@example.com', 'password123');

    // アクティブなルームに参加
    await element(by.id('discover-tab')).tap();
    await element(by.text('アクティブなルーム')).tap();
    await element(by.text('瞑想ガイドルーム')).tap();

    // ルーム画面が表示される
    await detoxExpect(element(by.text('瞑想ガイドルーム'))).toBeVisible();

    // 接続が悪くなったことをシミュレート
    await device.setStatusBar({ networkMode: 'airplane' });

    // 接続警告が表示される
    await detoxExpect(element(by.text('接続状態が悪くなっています'))).toBeVisible();

    // 接続を復元
    await device.setStatusBar({ networkMode: 'online' });

    // 接続が回復する
    await detoxExpect(element(by.text('接続が回復しました'))).toBeVisible();
    await detoxExpect(element(by.text('瞑想ガイドルーム'))).toBeVisible();

    // 再接続後もチャットが機能することを確認
    await element(by.id('chat-tab')).tap();
    await element(by.id('chat-input')).typeText('接続が回復しました！');
    await element(by.id('send-button')).tap();
    await detoxExpect(element(by.text('接続が回復しました！'))).toBeVisible();

    // ルームから退出
    await element(by.id('leave-room-button')).tap();
    await detoxExpect(element(by.text('ルームから退出しますか？'))).toBeVisible();
    await element(by.text('退出する')).tap();

    // ホーム画面に戻る
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
  });

  test('同時複数ユーザーのインタラクション', async () => {
    // この部分はマルチデバイステストとなるため、実際の実装では
    // 同時に複数のシミュレータ/エミュレータを使うか、クラウドテスト環境が必要

    // テストコード例として、複数デバイスの動作を一つのテストで表現
    await loginAsTestUser('host@example.com', 'password123');

    // ルーム作成
    await element(by.id('create-liveroom-button')).tap();
    await element(by.id('room-title-input')).typeText('複数ユーザーテスト');
    await element(by.id('create-room-button')).tap();
    await element(by.text('許可する')).tap();

    // 3人のリスナーが参加することをシミュレート
    await simulateMultipleListenersJoining(['user1', 'user2', 'user3']);

    // 参加者タブで全員が表示されていることを確認
    await element(by.id('participants-tab')).tap();
    await detoxExpect(element(by.text('user1'))).toBeVisible();
    await detoxExpect(element(by.text('user2'))).toBeVisible();
    await detoxExpect(element(by.text('user3'))).toBeVisible();

    // 参加者への一斉メッセージ
    await element(by.id('chat-tab')).tap();
    await element(by.id('chat-input')).typeText('全員こんにちは！');
    await element(by.id('send-button')).tap();

    // user1を登壇者に昇格
    await element(by.id('participants-tab')).tap();
    await element(by.text('user1')).longPress();
    await element(by.text('登壇者に昇格')).tap();

    // 複数人が同時に発言するシナリオをシミュレート
    await simulateMultipleSpeakers(['host', 'user1']);

    // 発言インジケータが表示される
    await detoxExpect(element(by.id('speaking-indicator-host'))).toBeVisible();
    await detoxExpect(element(by.id('speaking-indicator-user1'))).toBeVisible();

    // ルーム終了
    await element(by.id('room-menu-button')).tap();
    await element(by.text('ルームを終了')).tap();
    await element(by.text('終了する')).tap();
  });
});

// テスト用ヘルパー関数
async function loginAsTestUser(email, password) {
  // ログイン処理の実装
  await element(by.id('email-input')).typeText(email);
  await element(by.id('password-input')).typeText(password);
  await element(by.id('login-button')).tap();
}

async function simulateListenerJoining(email, password) {
  // 別のデバイスからのユーザー参加をシミュレート
  console.log(`Simulating listener joining: ${email}`);
}

async function simulateSpeakerRequest(username) {
  // 登壇リクエストをシミュレート
  console.log(`Simulating speaker request from: ${username}`);
}

async function simulateMultipleListenersJoining(usernames) {
  // 複数リスナーの参加をシミュレート
  console.log(`Simulating multiple listeners joining: ${usernames.join(', ')}`);
}

async function simulateMultipleSpeakers(usernames) {
  // 複数話者の発言をシミュレート
  console.log(`Simulating multiple speakers: ${usernames.join(', ')}`);
}
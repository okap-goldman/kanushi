import { device, element, by, expect as e2eExpect, waitFor } from 'detox';

describe('複数アカウント切り替えE2Eテスト', () => {
  it('アカウント切り替えでタイムラインが更新される', async () => {
    // メインアカウントでログイン済み
    await e2eExpect(element(by.text('メインアカウント'))).toBeVisible();
    
    // プロフィールアイコン長押し
    await element(by.id('profile-icon')).longPress();
    await e2eExpect(element(by.id('account-switcher'))).toBeVisible();
    
    // サブアカウントに切り替え
    await element(by.text('サブアカウント')).tap();
    
    // ローディング
    await e2eExpect(element(by.id('loading-indicator'))).toBeVisible();
    await waitFor(element(by.id('loading-indicator'))).toBeNotVisible().withTimeout(5000);
    
    // サブアカウントのタイムラインが表示
    await e2eExpect(element(by.text('サブアカウント'))).toBeVisible();
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
    
    // タイムラインの内容が切り替わっている
    await e2eExpect(element(by.text('サブアカウントの投稿'))).toBeVisible();
    await e2eExpect(element(by.text('メインアカウントの投稿'))).toBeNotVisible();
  });
});

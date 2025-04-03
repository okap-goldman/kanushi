import { test, expect } from '@playwright/test';

test.describe('動画投稿機能のテスト', () => {
  test('動画投稿ダイアログを開き、テスト用動画をアップロードする', async ({ page }) => {
    // トップページにアクセス
    await page.goto('http://localhost:4488');
    
    // 認証済み状態を模倣（ローカル開発環境では認証をスキップ）
    await page.evaluate(() => {
      localStorage.setItem('auth_state', JSON.stringify({
        isAuthenticated: true,
        user: { 
          id: 'test-user-id',
          name: 'テストユーザー',
          email: 'test@example.com'
        }
      }));
    });
    
    // ページをリロード（認証状態を反映するため）
    await page.reload();
    
    // 投稿ボタンをクリック
    await page.waitForSelector('[aria-label="新規投稿を作成"]');
    await page.click('[aria-label="新規投稿を作成"]');
    
    // ダイアログが表示されるのを待つ
    await page.waitForSelector('text="新規投稿を作成"');
    
    // 「動画・画像」タブをクリック
    await page.click('text="動画・画像"');
    
    // テスト動画を使用するボタンをクリック
    await page.click('text="テスト動画を使用"');
    
    // 動画が読み込まれるのを待つ
    await page.waitForSelector('video');
    
    // 説明文を入力
    await page.fill('textarea[placeholder="説明文を入力（任意）"]', 'Playwrightによる自動テスト動画投稿');
    
    // 公開設定をチェック（デフォルトで公開になっていることを確認）
    const isPublic = await page.isChecked('input[id="public-switch"]');
    expect(isPublic).toBeTruthy();
    
    // 投稿ボタンをクリック
    await page.click('button:has-text("投稿する")');
    
    // 成功メッセージを待つ
    await page.waitForSelector('text="投稿成功"');
    
    // トーストメッセージの内容を確認
    const toastText = await page.textContent('[role="status"]');
    expect(toastText).toContain('動画投稿が作成されました');
    
    // ダイアログが閉じられたことを確認
    await expect(page.locator('text="新規投稿を作成"')).toBeHidden();
    
    console.log('動画投稿テスト完了');
  });
  
  test('動画録画機能をテストする', async ({ page }) => {
    // トップページにアクセス
    await page.goto('http://localhost:4488');
    
    // 認証済み状態を模倣
    await page.evaluate(() => {
      localStorage.setItem('auth_state', JSON.stringify({
        isAuthenticated: true,
        user: { 
          id: 'test-user-id',
          name: 'テストユーザー',
          email: 'test@example.com'
        }
      }));
    });
    
    // ページをリロード
    await page.reload();
    
    // 投稿ボタンをクリック
    await page.waitForSelector('[aria-label="新規投稿を作成"]');
    await page.click('[aria-label="新規投稿を作成"]');
    
    // 「動画・画像」タブをクリック
    await page.click('text="動画・画像"');
    
    // カメラアクセス権限を付与するモックを設定
    await page.context().grantPermissions(['camera', 'microphone']);
    
    // 「録画を開始」ボタンをクリック
    await page.click('text="録画を開始"');
    
    // モック録画を数秒間実行
    await page.waitForTimeout(3000);
    
    // 録画停止ボタンをクリック
    await page.click('text="録画を停止"');
    
    // 録画された動画が表示されるのを待つ
    await page.waitForSelector('video');
    
    // 説明文を入力
    await page.fill('textarea[placeholder="説明文を入力（任意）"]', 'カメラ録画テスト');
    
    // 投稿ボタンをクリック（実際には投稿せず、テストのみ）
    // await page.click('button:has-text("投稿する")');
    
    // テスト完了後にダイアログを閉じる
    await page.click('button[aria-label="Close"]');
    
    console.log('録画機能テスト完了');
  });
}); 
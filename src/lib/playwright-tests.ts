/**
 * Playwrightテストモジュール
 * 
 * アプリケーションのUIおよび機能テストを自動化するためのPlaywrightテストスイートを提供します。
 * 実際のユーザー操作をシミュレートし、UI要素の表示や機能が期待通りに動作することを検証します。
 */
import { test, expect } from '@playwright/test';

/**
 * 動画投稿機能のテスト
 * 
 * アプリケーションの動画投稿機能が正常に動作することを検証します。
 * このテストでは以下のステップを実行します：
 * 1. アプリケーションページへのアクセス
 * 2. 投稿ボタンのクリック
 * 3. 動画・画像投稿オプションの選択
 * 4. テスト動画の追加
 * 5. 説明文の入力
 * 6. 投稿処理の実行と成功の確認
 * 
 * @param {Object} param0 - Playwrightのテストパラメータ
 * @param {Page} param0.page - テスト対象のページオブジェクト
 */
test('動画投稿機能のテスト', async ({ page }) => {
  // アプリケーションページにアクセス
  await page.goto('http://localhost:4488');
  
  // ページのタイトルを確認
  await expect(page).toHaveTitle(/目醒め人のためのSNS/);
  
  // 投稿ボタンをクリック
  await page.getByRole('button', { name: '投稿する' }).click();
  
  // 投稿ダイアログが表示されることを確認
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('新規投稿を作成')).toBeVisible();
  
  // 動画・画像投稿オプションを選択
  await page.getByText('動画・画像').click();
  
  // テスト動画を使用ボタンをクリック
  await page.getByRole('button', { name: 'テスト動画を使用' }).click();
  
  // 動画がロードされることを確認
  await expect(page.locator('video')).toBeVisible();
  
  // 説明文を入力
  await page.getByLabel('説明文').fill('Playwrightによる自動テスト動画投稿');
  
  // 公開設定を確認（デフォルトで公開）
  await expect(page.getByText('公開')).toBeVisible();
  
  // 投稿ボタンをクリック
  await page.getByRole('button', { name: '投稿する' }).click();
  
  // 処理中の表示を確認
  await expect(page.getByText('処理中...')).toBeVisible();
  
  // 成功メッセージが表示されるのを待つ
  await expect(page.getByText('動画投稿が作成されました')).toBeVisible({ timeout: 10000 });
  
  // ダイアログが閉じることを確認
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 });
  
  console.log('動画投稿テスト完了');
});

/**
 * 動画投稿のエラーケースのテスト
 * 
 * ファイルが選択されていない場合の動画投稿機能のエラー処理を検証します。
 * このテストでは以下のステップを実行します：
 * 1. アプリケーションページへのアクセス
 * 2. 投稿ボタンのクリック
 * 3. 動画・画像投稿オプションの選択
 * 4. 説明文のみ入力（ファイルは選択しない）
 * 5. 投稿ボタンが無効化（disabled）されていることの確認
 * 
 * @param {Object} param0 - Playwrightのテストパラメータ
 * @param {Page} param0.page - テスト対象のページオブジェクト
 */
test('動画投稿のエラーケース（ファイル未選択）', async ({ page }) => {
  // アプリケーションページにアクセス
  await page.goto('http://localhost:4488');
  
  // 投稿ボタンをクリック
  await page.getByRole('button', { name: '投稿する' }).click();
  
  // 動画・画像投稿オプションを選択
  await page.getByText('動画・画像').click();
  
  // 説明文だけ入力（ファイルは選択しない）
  await page.getByLabel('説明文').fill('エラーテストケース');
  
  // 投稿ボタンがdisabledであることを確認
  await expect(page.getByRole('button', { name: '投稿する' })).toBeDisabled();
  
  console.log('動画投稿エラーケーステスト完了');
});

/**
 * テストパラメータを使った動画投稿テスト
 * 
 * URLパラメータを使用した自動テストモードでの動画投稿機能を検証します。
 * このテストでは以下のステップを実行します：
 * 1. テストモードフラグ付きでアプリケーションページへのアクセス
 * 2. 投稿ボタンのクリック
 * 3. 動画・画像投稿オプションの選択
 * 4. テストモードでの自動動画ロードの確認
 * 5. 説明文が自動入力されることの確認
 * 6. 投稿処理の実行と成功の確認
 * 
 * @param {Object} param0 - Playwrightのテストパラメータ
 * @param {Page} param0.page - テスト対象のページオブジェクト
 */
test('URLパラメータを使った自動動画投稿テスト', async ({ page }) => {
  // テストモードフラグ付きでアクセス
  await page.goto('http://localhost:4488?test=true');
  
  // 投稿ボタンをクリック
  await page.getByRole('button', { name: '投稿する' }).click();
  
  // 動画・画像投稿オプションを選択
  await page.getByText('動画・画像').click();
  
  // テストモードでは自動的に動画がロードされるはず
  await expect(page.locator('video')).toBeVisible();
  await expect(page.getByLabel('説明文')).toHaveValue('テスト用動画投稿');
  
  // 投稿ボタンをクリック
  await page.getByRole('button', { name: '投稿する' }).click();
  
  // 成功メッセージが表示されるのを待つ
  await expect(page.getByText('動画投稿が作成されました')).toBeVisible({ timeout: 10000 });
  
  console.log('URLパラメータを使った自動動画投稿テスト完了');
}); 
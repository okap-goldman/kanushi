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

describe('Authentication E2E', () => {
  it('既存ユーザーのログインが成功する', async () => {
    // Given - 既存ユーザーを事前作成
    await createE2EUser({
      email: 'e2e-existing@example.com',
      displayName: '既存E2Eユーザー',
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
    await waitFor(
      element(by.text('表示名を入力してください')).or(by.text('ファミリータイムライン'))
    )
      .toBeVisible()
      .withTimeout(10000);
  });
});

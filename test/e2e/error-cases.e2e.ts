import { by, device, expect as e2eExpect, element, waitFor } from 'detox';

describe('エラーケースE2Eテスト', () => {
  it('ネットワークエラー時の投稿', async () => {
    // 投稿作成画面
    await element(by.id('create-post-button')).tap();
    await element(by.text('テキスト投稿')).tap();
    await element(by.id('text-input')).typeText('ネットワークエラーテスト');

    // ネットワークを切断
    await device.setAirplaneMode(true);

    // 投稿試行
    await element(by.id('submit-button')).tap();

    // エラー表示
    await e2eExpect(element(by.text('ネットワークエラー'))).toBeVisible();
    await e2eExpect(element(by.text('オフラインで保存されました'))).toBeVisible();

    // ネットワーク復帰
    await device.setAirplaneMode(false);

    // 自動再送信の確認
    await waitFor(element(by.text('投稿を送信中...')))
      .toBeVisible()
      .withTimeout(5000);
    await waitFor(element(by.text('投稿が完了しました')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('レート制限エラー', async () => {
    // 11回連続投稿
    for (let i = 0; i < 11; i++) {
      await element(by.id('create-post-button')).tap();
      await element(by.text('テキスト投稿')).tap();
      await element(by.id('text-input')).typeText(`連続投稿 ${i + 1}`);
      await element(by.id('submit-button')).tap();

      if (i < 10) {
        // 最初の10回は成功
        await waitFor(element(by.id('timeline-screen')))
          .toBeVisible()
          .withTimeout(3000);
      }
    }

    // 11回目でレート制限エラー
    await e2eExpect(element(by.text('レート制限'))).toBeVisible();
    await e2eExpect(element(by.text('1分間に10件まで'))).toBeVisible();

    // カウントダウン表示
    await e2eExpect(element(by.id('retry-countdown'))).toBeVisible();
  });
});

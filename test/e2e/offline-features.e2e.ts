import { by, device, expect as e2eExpect, element, waitFor } from 'detox';

describe('オフライン機能E2Eテスト', () => {
  it('投稿を後で見るに保存し、オフラインで閲覧', async () => {
    // オンライン状態で投稿を保存
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();

    // 最初の投稿を後で見るに追加
    await element(by.id('more-button').atIndex(0)).tap();
    await element(by.text('後で見る')).tap();
    await e2eExpect(element(by.text('保存しました'))).toBeVisible();

    // 機内モードON（オフライン状態）
    await device.setAirplaneMode(true);

    // 後で見るリストへ
    await element(by.id('menu-button')).tap();
    await element(by.text('後で見る')).tap();

    // 保存した投稿が表示される
    await e2eExpect(element(by.id('offline-content-list'))).toBeVisible();
    await e2eExpect(element(by.id('offline-post-0'))).toBeVisible();

    // オフラインで投稿を開く
    await element(by.id('offline-post-0')).tap();
    await e2eExpect(element(by.id('post-detail-screen'))).toBeVisible();

    // 音声再生（オフライン）
    await element(by.id('play-button')).tap();
    await e2eExpect(element(by.id('audio-playing-indicator'))).toBeVisible();

    // 機内モードOFF
    await device.setAirplaneMode(false);
  });
});

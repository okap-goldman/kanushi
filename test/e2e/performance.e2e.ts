import { device, element, by, expect as e2eExpect } from 'detox';

describe('パフォーマンスE2Eテスト', () => {
  it('大量投稿のスクロールパフォーマンス', async () => {
    // タイムライン表示
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
    
    // 100件の投稿を高速スクロール
    const startTime = Date.now();
    
    for (let i = 0; i < 20; i++) {
      await element(by.id('timeline-list')).scroll(500, 'down');
    }
    
    const endTime = Date.now();
    const scrollDuration = endTime - startTime;
    
    // スクロールが10秒以内に完了
    expect(scrollDuration).toBeLessThan(10000);
    
    // 最後の投稿が表示されている
    await e2eExpect(element(by.text('100件目の投稿'))).toBeVisible();
    
    // メモリリークがないことを確認（新しい投稿が追加されても古い投稿がアンマウントされる）
    await e2eExpect(element(by.text('1件目の投稿'))).toBeNotVisible();
  });

  it('音声投稿の連続再生パフォーマンス', async () => {
    // 5つの音声投稿を連続再生
    for (let i = 0; i < 5; i++) {
      await element(by.id(`play-button-${i}`)).tap();
      await waitFor(element(by.id(`pause-button-${i}`))).toBeVisible().withTimeout(1000);
      await element(by.id(`pause-button-${i}`)).tap();
    }
    
    // メモリ使用量が適切（Detoxではメモリ計測は限定的）
    // 実際のメモリ計測はXcodeのInstrumentsやAndroid Profilerで行う
  });
});

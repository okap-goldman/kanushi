import { by, device, expect as e2eExpect, element } from 'detox';

describe('投稿作成E2Eテスト', () => {
  beforeAll(async () => {
    await device.launchApp({
      permissions: { notifications: 'YES', camera: 'YES', microphone: 'YES' },
    });
    await device.reloadReactNative();
  });

  beforeEach(async () => {
    // ログイン状態にする
    await element(by.id('email-input')).typeText('test@example.com');
    await element(by.id('password-input')).typeText('testpassword');
    await element(by.id('login-button')).tap();
    await e2eExpect(element(by.id('timeline-screen'))).toBeVisible();
  });

  it('テキスト投稿の完全なフロー', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await e2eExpect(element(by.text('メディアタイプを選択'))).toBeVisible();

    // テキスト投稿を選択
    await element(by.text('テキスト投稿')).tap();

    // テキスト入力
    await element(by.id('text-input')).typeText('E2Eテスト投稿です\n改行も含みます');

    // ハッシュタグ追加
    await element(by.id('hashtag-input')).typeText('E2Eテスト');
    await element(by.id('add-hashtag-button')).tap();

    // 投稿
    await element(by.id('submit-button')).tap();

    // タイムラインに表示確認
    await e2eExpect(element(by.text('E2Eテスト投稿です'))).toBeVisible();
    await e2eExpect(element(by.text('#E2Eテスト'))).toBeVisible();

    // いいね
    await element(by.id('like-button').withAncestor(by.id('post-test-e2e'))).tap();
    await e2eExpect(element(by.id('like-count').withAncestor(by.id('post-test-e2e')))).toHaveText(
      '1'
    );

    // コメント
    await element(by.id('comment-button').withAncestor(by.id('post-test-e2e'))).tap();
    await element(by.id('comment-input')).typeText('E2Eコメント');
    await element(by.id('send-comment-button')).tap();
    await e2eExpect(element(by.text('E2Eコメント'))).toBeVisible();
  });

  it('音声投稿の録音と再生', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await element(by.text('音声投稿')).tap();

    // 録音開始
    await element(by.id('record-button')).tap();
    await e2eExpect(element(by.id('recording-indicator'))).toBeVisible();

    // 5秒待機
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // 録音停止
    await element(by.id('stop-button')).tap();
    await e2eExpect(element(by.id('audio-preview'))).toBeVisible();

    // プレビュー再生
    await element(by.id('preview-play-button')).tap();
    await e2eExpect(element(by.id('preview-pause-button'))).toBeVisible();

    // 投稿本文入力
    await element(by.id('post-text-input')).typeText('E2E音声投稿');

    // 投稿
    await element(by.id('submit-button')).tap();

    // タイムラインで再生
    await e2eExpect(
      element(by.id('audio-player').withAncestor(by.text('E2E音声投稿')))
    ).toBeVisible();
    await element(by.id('play-button').withAncestor(by.text('E2E音声投稿'))).tap();
    await e2eExpect(
      element(by.id('pause-button').withAncestor(by.text('E2E音声投稿')))
    ).toBeVisible();
  });

  it('画像投稿（ギャラリー選択）', async () => {
    // 投稿作成画面へ
    await element(by.id('create-post-button')).tap();
    await element(by.text('画像投稿')).tap();

    // ギャラリーから選択
    await element(by.id('gallery-button')).tap();

    // 最初の画像を選択（Detoxでは実際の画像選択をシミュレート）
    await element(by.id('gallery-image-0')).tap();

    // プレビュー確認
    await e2eExpect(element(by.id('image-preview'))).toBeVisible();

    // 投稿本文
    await element(by.id('post-text-input')).typeText('E2E画像投稿');

    // 投稿
    await element(by.id('submit-button')).tap();

    // タイムラインに表示確認
    await e2eExpect(
      element(by.id('post-image').withAncestor(by.text('E2E画像投稿')))
    ).toBeVisible();
  });
});

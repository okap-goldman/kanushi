import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { test, Page } from '@playwright/test';
import { createTestUser, loginAsUser, navigateToScreen } from '../setup/e2e';

describe('フォロー機能のE2Eテスト', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  beforeEach(async () => {
    await page.reload();
  });

  describe('4.1 ユーザーストーリーベーステスト', () => {
    describe('4.1.1 新規ユーザーの初回フォロー体験', () => {
      test('新規ユーザーのフォロー初体験', async () => {
        // Given - 初回ログインの新規ユーザーと人気投稿のあるおすすめユーザー
        const newUser = await createTestUser({
          displayName: '新規ユーザー',
          isFirstTime: true,
        });
        const recommendedUser = await createTestUser({
          displayName: 'スピリチュアル先生',
          hasPopularPosts: true,
          posts: [
            {
              content: '今日の瞑想音声です',
              postType: 'audio',
              audioUrl: 'https://example.com/meditation.mp3',
            },
          ],
        });

        // When - 新規ユーザーとしてログイン
        await loginAsUser(page, newUser);

        // Step 1: ディスカバー画面でおすすめユーザーを表示
        await navigateToScreen(page, 'discover');
        await page.waitForSelector('text=おすすめのユーザー');

        // Step 2: おすすめユーザーをタップ
        await page.click(`text=${recommendedUser.displayName}`);
        await page.waitForSelector(`text=${recommendedUser.displayName}のプロフィール`);

        // Step 3: プロフィールでフォローボタンをタップ
        const followButton = await page.locator('[data-testid="follow-button"]');
        await followButton.click();

        // Step 4: 初回ユーザー向けフォロータイプ説明を表示
        await page.waitForSelector('text=フォローの種類について');
        expect(await page.locator('text=ファミリーフォロー').isVisible()).toBe(true);
        expect(await page.locator('text=ウォッチフォロー').isVisible()).toBe(true);

        // Step 5: ファミリーフォローを選択
        await page.click('text=ファミリーフォローを選ぶ');

        // Step 6: 有意義な理由を入力してフォロー
        const reasonInput = await page.locator('[data-testid="follow-reason-input"]');
        await reasonInput.fill('瞑想音声がとても心に響きました。先生の教えをもっと学びたいです。');
        
        await page.click('[data-testid="follow-confirm-button"]');

        // Then - 期待結果を検証
        // フォロー状態になり、ファミリーバッジが表示される
        await page.waitForSelector('text=フォロー中');
        expect(await page.locator('[data-testid="family-badge"]').isVisible()).toBe(true);

        // ファミリータイムラインに移動すると対象ユーザーの投稿が表示される
        await navigateToScreen(page, 'timeline');
        await page.click('[data-testid="timeline-filter-family"]');
        
        await page.waitForSelector(`text=${recommendedUser.displayName}`);
        expect(await page.locator('text=今日の瞑想音声です').isVisible()).toBe(true);
      });
    });

    describe('4.1.2 相互フォロー発見と深い繋がり構築', () => {
      test('相互フォロー関係構築', async () => {
        // Given - 2人のユーザー
        const user1 = await createTestUser({
          displayName: 'ユーザー1',
          bio: 'スピリチュアルな学びを共有します',
        });
        const user2 = await createTestUser({
          displayName: 'ユーザー2',
          bio: '瞑想と内省を大切にしています',
        });

        // Step 1: ユーザー1がユーザー2をウォッチフォロー
        await loginAsUser(page, user1);
        await navigateToScreen(page, 'search');
        await page.fill('[data-testid="search-input"]', user2.displayName);
        await page.click(`text=${user2.displayName}`);

        await page.click('[data-testid="follow-button"]');
        await page.click('text=ウォッチフォロー');

        // Step 2: ユーザー2が通知を確認
        await loginAsUser(page, user2);
        await navigateToScreen(page, 'notifications');
        await page.waitForSelector(`text=${user1.displayName}さんがあなたをフォローしました`);

        // Step 3: ユーザー1のプロフィールを確認
        await page.click(`text=${user1.displayName}`);
        await page.waitForSelector(`text=${user1.bio}`);

        // Step 4: ファミリーフォローで返す
        await page.click('[data-testid="follow-button"]');
        await page.click('text=ファミリーフォローを選ぶ');
        
        const reasonInput = await page.locator('[data-testid="follow-reason-input"]');
        await reasonInput.fill('私の投稿にも興味を持ってくれたので、ぜひ交流したいです');
        await page.click('[data-testid="follow-confirm-button"]');

        // Then - 期待結果を検証
        // 相互フォロー表示が出る
        await page.waitForSelector('[data-testid="mutual-follow-indicator"]');

        // ユーザー1にもフォローバック通知が届く
        await loginAsUser(page, user1);
        await navigateToScreen(page, 'notifications');
        await page.waitForSelector(`text=${user2.displayName}さんがあなたをフォローしました`);
        expect(await page.locator('[data-testid="follow-back-badge"]').isVisible()).toBe(true);
      });
    });
  });

  describe('4.2 複数ユーザーシナリオ', () => {
    describe('4.2.1 コミュニティ形成シナリオ', () => {
      test('フォローを通じたコミュニティ形成', async () => {
        // Given - スピリチュアル先生（認証済み）と3人の生徒
        const teacher = await createTestUser({
          displayName: 'スピリチュアル先生',
          isVerified: true,
          posts: [
            {
              content: '今日の気づき：すべてはつながっている',
              postType: 'audio',
              audioUrl: 'https://example.com/wisdom.mp3',
            },
          ],
        });

        const students = await Promise.all([
          createTestUser({ displayName: '生徒1' }),
          createTestUser({ displayName: '生徒2' }),
          createTestUser({ displayName: '生徒3' }),
        ]);

        // Step 1: 先生が価値ある音声コンテンツを投稿（既に投稿済み）

        // Step 2: 生徒たちが先生をファミリーフォロー
        for (const student of students) {
          await loginAsUser(page, student);
          await navigateToScreen(page, 'search');
          await page.fill('[data-testid="search-input"]', teacher.displayName);
          await page.click(`text=${teacher.displayName}`);

          await page.click('[data-testid="follow-button"]');
          await page.click('text=ファミリーフォローを選ぶ');
          
          const reasonInput = await page.locator('[data-testid="follow-reason-input"]');
          await reasonInput.fill('先生の教えから多くを学んでいます');
          await page.click('[data-testid="follow-confirm-button"]');
        }

        // Step 3: 生徒1が先生のフォロワーリストから他の生徒を発見
        await loginAsUser(page, students[0]);
        await navigateToScreen(page, 'search');
        await page.click(`text=${teacher.displayName}`);
        await page.click('[data-testid="followers-tab"]');

        // 他の生徒が表示されることを確認
        await page.waitForSelector(`text=${students[1].displayName}`);
        await page.waitForSelector(`text=${students[2].displayName}`);

        // Step 4: 生徒1が他の生徒をウォッチフォロー
        await page.click(`text=${students[1].displayName}`);
        await page.click('[data-testid="follow-button"]');
        await page.click('text=ウォッチフォロー');

        // Then - 期待結果を検証
        // 生徒1のタイムラインに先生と他の生徒の投稿が表示される
        await navigateToScreen(page, 'timeline');
        await page.waitForSelector(`text=${teacher.displayName}`);
        await page.waitForSelector('text=今日の気づき：すべてはつながっている');

        // 先生側からはコミュニティが形成されていることが確認できる
        await loginAsUser(page, teacher);
        await navigateToScreen(page, 'profile');
        await page.click('[data-testid="followers-count"]');
        
        // 3人の生徒がフォロワーとして表示される
        for (const student of students) {
          expect(await page.locator(`text=${student.displayName}`).isVisible()).toBe(true);
        }
      });
    });

    describe('4.2.2 フォロー関係の自然な発展', () => {
      test('ウォッチからファミリーへの関係発展', async () => {
        // Given - コンテンツクリエイターとフォロワー
        const creator = await createTestUser({
          displayName: 'コンテンツクリエイター',
          posts: Array.from({ length: 5 }, (_, i) => ({
            content: `価値あるコンテンツ ${i + 1}`,
            postType: 'text' as const,
          })),
        });

        const follower = await createTestUser({
          displayName: 'アクティブフォロワー',
        });

        // Step 1: フォロワーが最初にウォッチフォロー
        await loginAsUser(page, follower);
        await navigateToScreen(page, 'search');
        await page.fill('[data-testid="search-input"]', creator.displayName);
        await page.click(`text=${creator.displayName}`);

        await page.click('[data-testid="follow-button"]');
        await page.click('text=ウォッチフォロー');

        // Step 2: 一定期間、コンテンツに積極的にエンゲージ
        await navigateToScreen(page, 'timeline');
        
        // いいねとコメントを複数回行う
        for (let i = 0; i < 3; i++) {
          const postElement = await page.locator(`text=価値あるコンテンツ ${i + 1}`).locator('..');
          await postElement.locator('[data-testid="like-button"]').click();
          await postElement.locator('[data-testid="comment-button"]').click();
          
          const commentInput = await page.locator('[data-testid="comment-input"]');
          await commentInput.fill(`素晴らしい投稿です！勉強になります ${i + 1}`);
          await page.click('[data-testid="comment-submit"]');
        }

        // Step 3: 価値を認識し、ファミリーフォローに変更
        await page.click(`text=${creator.displayName}`);
        await page.click('[data-testid="following-button"]');
        await page.click('text=フォロータイプを変更');
        await page.click('text=ファミリーフォローに変更');
        
        const reasonInput = await page.locator('[data-testid="follow-reason-input"]');
        await reasonInput.fill('投稿から多くの学びを得ています。より深い繋がりを持ちたいです。');
        await page.click('[data-testid="confirm-button"]');

        // Then - 期待結果を検証
        // フォロータイプが更新される
        await page.waitForSelector('[data-testid="family-badge"]');

        // クリエイターに通知が届く
        await loginAsUser(page, creator);
        await navigateToScreen(page, 'notifications');
        await page.waitForSelector(`text=${follower.displayName}さんがファミリーフォローに変更しました`);
      });
    });
  });

  describe('4.3 エラーシナリオと復旧テスト', () => {
    describe('4.3.1 ネットワーク断続時のフォロー操作', () => {
      test('ネットワーク回復力', async () => {
        // Given - 2人のユーザー
        const user1 = await createTestUser({ displayName: 'ユーザーA' });
        const user2 = await createTestUser({ displayName: 'ユーザーB' });

        await loginAsUser(page, user1);
        await navigateToScreen(page, 'search');
        await page.fill('[data-testid="search-input"]', user2.displayName);
        await page.click(`text=${user2.displayName}`);

        // Step 1: フォローボタンをタップ
        await page.click('[data-testid="follow-button"]');

        // Step 2: ファミリーフォローを選択し理由を入力
        await page.click('text=ファミリーフォローを選ぶ');
        const reasonInput = await page.locator('[data-testid="follow-reason-input"]');
        await reasonInput.fill('素晴らしいコンテンツをありがとうございます');

        // Step 3: ネットワーク切断をシミュレート
        await page.context().setOffline(true);

        // Step 4: フォロー確定
        await page.click('[data-testid="follow-confirm-button"]');

        // Then - オフライン状態とキューイングメッセージが表示される
        await page.waitForSelector('text=オフライン中です');
        await page.waitForSelector('text=ネットワーク接続が回復したら自動的に送信されます');

        // ネットワーク復旧後、フォロー操作が完了される
        await page.context().setOffline(false);
        
        // 自動リトライを待つ
        await page.waitForSelector('text=フォローしました', { timeout: 10000 });
        expect(await page.locator('[data-testid="follow-status"]').textContent()).toBe('フォロー中');
      });
    });
  });
});
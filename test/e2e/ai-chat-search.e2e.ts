import { expect, test } from '@playwright/test';

test.describe('AI Chat and Search E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      window.localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          current_session: {
            access_token: 'mock-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'mock-refresh-token',
            user: {
              id: 'test-user-id',
              email: 'test@example.com',
              user_metadata: {},
              app_metadata: {},
              aud: 'authenticated',
              created_at: '2024-01-01T00:00:00.000Z',
            },
          },
        })
      );
    });

    // Navigate to the app
    await page.goto('http://localhost:8081');
  });

  test('should search for content using the search bar', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Type in search bar
    const searchInput = page.getByPlaceholder('検索...（AIに聞く）');
    await searchInput.fill('瞑想');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Verify results appear
    const results = await page.getByTestId('search-results').count();
    expect(results).toBeGreaterThan(0);
  });

  test('should open AI chat and have a conversation', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Send a message
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('こんにちは、今日の瞑想について教えてください');
    await page.getByTestId('send-message-button').click();

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });

    // Verify response exists
    const aiResponse = await page.getByTestId('ai-message').first().textContent();
    expect(aiResponse).toBeTruthy();
    expect(aiResponse!.length).toBeGreaterThan(0);
  });

  test('should use quick actions in AI chat', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Click on quick action
    await page.getByText('イベントを探す').click();

    // Wait for message to be sent and response
    await page.waitForSelector('[data-testid="user-message"]', { timeout: 5000 });
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });

    // Verify the conversation
    const userMessage = await page.getByTestId('user-message').last().textContent();
    expect(userMessage).toContain('イベントを探したいです');
  });

  test('should show recommendations in AI chat', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Click recommendations button
    await page.getByTestId('recommendations-button').click();

    // Wait for recommendations modal
    await page.waitForSelector('[data-testid="recommendations-view"]', { timeout: 10000 });

    // Verify recommendations content
    await expect(page.getByText(/投稿: \d+件/)).toBeVisible();
    await expect(page.getByText(/ユーザー: \d+人/)).toBeVisible();
    await expect(page.getByText(/イベント: \d+件/)).toBeVisible();
  });

  test('should clear chat history', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Send a message first
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('テストメッセージ');
    await page.getByTestId('send-message-button').click();

    // Wait for message to appear
    await page.waitForSelector('[data-testid="user-message"]', { timeout: 5000 });

    // Clear chat history
    await page.getByTestId('clear-chat-button').click();

    // Verify toast message
    await expect(page.getByText('履歴をクリアしました')).toBeVisible();

    // Verify messages are cleared
    const messages = await page.getByTestId('user-message').count();
    expect(messages).toBe(0);
  });

  test('should handle search errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/functions/ai-search', (route) => {
      route.abort('failed');
    });

    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Try to search
    const searchInput = page.getByPlaceholder('検索...（AIに聞く）');
    await searchInput.fill('エラーテスト');
    await searchInput.press('Enter');

    // Verify error toast
    await expect(page.getByText('検索に失敗しました')).toBeVisible({ timeout: 5000 });
  });

  test('should handle AI chat errors gracefully', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Mock network error for AI chat
    await page.route('**/functions/ai-chat', (route) => {
      route.abort('failed');
    });

    // Try to send message
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('エラーテスト');
    await page.getByTestId('send-message-button').click();

    // Verify error toast
    await expect(page.getByText('メッセージの送信に失敗しました')).toBeVisible({ timeout: 5000 });
  });

  test('should integrate search results with AI chat', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Perform a search first
    const searchInput = page.getByPlaceholder('検索...（AIに聞く）');
    await searchInput.fill('音声瞑想');
    await searchInput.press('Enter');

    // Wait for search results
    await page.waitForSelector('[data-testid="search-results"]', { timeout: 10000 });

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Ask about the search results
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('先ほど検索した音声瞑想について詳しく教えてください');
    await page.getByTestId('send-message-button').click();

    // Wait for AI response
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });

    // Verify AI understood the context
    const aiResponse = await page.getByTestId('ai-message').last().textContent();
    expect(aiResponse).toContain('瞑想');
  });

  test('should navigate from AI recommendations to content', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Ask for recommendations
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('おすすめの投稿を教えてください');
    await page.getByTestId('send-message-button').click();

    // Wait for AI response with recommendations
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });

    // Check if recommendations are clickable
    const recommendationLinks = await page.getByTestId('recommendation-link').count();
    if (recommendationLinks > 0) {
      // Click on first recommendation
      await page.getByTestId('recommendation-link').first().click();

      // Verify navigation to post detail
      await expect(page).toHaveURL(/\/post\/[\w-]+/);
    }
  });

  test('should maintain conversation context across messages', async ({ page }) => {
    // Navigate to search screen
    await page.getByTestId('nav-search').click();

    // Open AI chat
    await page.getByTestId('ai-chat-button').click();

    // Wait for AI chat modal
    await page.waitForSelector('text=AIアシスタント', { timeout: 5000 });

    // Send first message
    const messageInput = page.getByPlaceholder('メッセージを入力...');
    await messageInput.fill('私は瞑想初心者です');
    await page.getByTestId('send-message-button').click();

    // Wait for first response
    await page.waitForSelector('[data-testid="ai-message"]', { timeout: 15000 });

    // Send follow-up message
    await messageInput.fill('初心者におすすめの方法は？');
    await page.getByTestId('send-message-button').click();

    // Wait for second response
    await page.waitForSelector('[data-testid="ai-message"]:nth-of-type(2)', { timeout: 15000 });

    // Verify AI maintained context
    const secondResponse = await page.getByTestId('ai-message').nth(1).textContent();
    expect(secondResponse).toContain('初心者');
  });
});

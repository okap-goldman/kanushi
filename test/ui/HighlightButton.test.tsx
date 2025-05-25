import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HighlightButton } from '../../src/components/post/HighlightButton';
import * as highlightService from '../../src/lib/highlightService';

vi.mock('../../src/lib/highlightService', () => ({
  createHighlight: vi.fn(),
  removeHighlight: vi.fn(),
  checkHighlighted: vi.fn(),
  getHighlights: vi.fn(),
}));

vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user1' } }),
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('HighlightButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未ハイライト状態で正しく表示される', () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });

    const { getByTestId } = render(
      <HighlightButton postId="post1" initialHighlighted={false} initialCount={0} />
    );

    const button = getByTestId('highlight-button');
    expect(button).toBeTruthy();
  });

  it('ハイライト済み状態で正しく表示される', () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: true, error: null });

    const { getByTestId } = render(
      <HighlightButton postId="post1" initialHighlighted={true} initialCount={5} />
    );

    const button = getByTestId('highlight-button');
    expect(button).toBeTruthy();
    expect(getByTestId('highlight-count').textContent).toBe('5');
  });

  it('ボタンクリックでダイアログが表示される', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });

    const { getByTestId, queryByTestId } = render(
      <HighlightButton postId="post1" />
    );

    expect(queryByTestId('highlight-dialog')).toBeNull();

    fireEvent.press(getByTestId('highlight-button'));

    await waitFor(() => {
      expect(getByTestId('highlight-dialog')).toBeTruthy();
    });
  });

  it('理由を入力してハイライトを作成できる', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });
    vi.mocked(highlightService.createHighlight).mockResolvedValue({ 
      data: { 
        id: 'highlight1', 
        reason: '素晴らしい投稿です',
        post_id: 'post1',
        user_id: 'user1',
        created_at: new Date().toISOString()
      }, 
      error: null 
    });
    const onHighlightChange = vi.fn();

    const { getByTestId, getByPlaceholderText } = render(
      <HighlightButton postId="post1" onHighlightChange={onHighlightChange} />
    );

    fireEvent.press(getByTestId('highlight-button'));

    const input = getByPlaceholderText('この投稿をハイライトする理由を入力してください');
    fireEvent.changeText(input, '素晴らしい投稿です');

    fireEvent.press(getByTestId('highlight-submit-button'));

    await waitFor(() => {
      expect(highlightService.createHighlight).toHaveBeenCalledWith({
        post_id: 'post1',
        user_id: 'user1',
        reason: '素晴らしい投稿です',
      });
      expect(onHighlightChange).toHaveBeenCalledWith(true, 1);
    });
  });

  it('ハイライト済みの場合、ハイライトを解除できる', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: true, error: null });
    vi.mocked(highlightService.removeHighlight).mockResolvedValue({ data: true, error: null });
    const onHighlightChange = vi.fn();

    const { getByTestId } = render(
      <HighlightButton 
        postId="post1" 
        initialHighlighted={true} 
        initialCount={5} 
        onHighlightChange={onHighlightChange} 
      />
    );

    fireEvent.press(getByTestId('highlight-button'));

    fireEvent.press(getByTestId('highlight-submit-button'));

    await waitFor(() => {
      expect(highlightService.removeHighlight).toHaveBeenCalledWith('post1', 'user1');
      expect(onHighlightChange).toHaveBeenCalledWith(false, 4);
    });
  });

  it('空の理由ではハイライトできない', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });
    const onHighlightChange = vi.fn();

    const { getByTestId, getByText } = render(
      <HighlightButton postId="post1" onHighlightChange={onHighlightChange} />
    );

    fireEvent.press(getByTestId('highlight-button'));

    fireEvent.press(getByTestId('highlight-submit-button'));

    await waitFor(() => {
      expect(getByText('理由を入力してください')).toBeTruthy();
      expect(highlightService.createHighlight).not.toHaveBeenCalled();
      expect(onHighlightChange).not.toHaveBeenCalled();
    });
  });

  it('短すぎる理由ではハイライトできない', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });
    const onHighlightChange = vi.fn();

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <HighlightButton postId="post1" onHighlightChange={onHighlightChange} />
    );

    fireEvent.press(getByTestId('highlight-button'));

    const input = getByPlaceholderText('この投稿をハイライトする理由を入力してください');
    fireEvent.changeText(input, '短い');

    fireEvent.press(getByTestId('highlight-submit-button'));

    await waitFor(() => {
      expect(getByText('理由は5文字以上入力してください')).toBeTruthy();
      expect(highlightService.createHighlight).not.toHaveBeenCalled();
      expect(onHighlightChange).not.toHaveBeenCalled();
    });
  });

  it('ハイライト作成時にエラーが発生した場合、エラーメッセージが表示される', async () => {
    vi.mocked(highlightService.checkHighlighted).mockResolvedValue({ data: false, error: null });
    vi.mocked(highlightService.createHighlight).mockResolvedValue({ 
      data: null, 
      error: new Error('データベースエラーが発生しました')
    });
    const onHighlightChange = vi.fn();

    const { getByTestId, getByPlaceholderText, getByText } = render(
      <HighlightButton postId="post1" onHighlightChange={onHighlightChange} />
    );

    fireEvent.press(getByTestId('highlight-button'));

    const input = getByPlaceholderText('この投稿をハイライトする理由を入力してください');
    fireEvent.changeText(input, '素晴らしい投稿です');

    fireEvent.press(getByTestId('highlight-submit-button'));

    await waitFor(() => {
      expect(getByText('ハイライトの更新に失敗しました')).toBeTruthy();
      expect(onHighlightChange).not.toHaveBeenCalled();
    });
  });

});

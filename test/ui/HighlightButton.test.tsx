import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { HighlightButton } from '../../src/components/post/HighlightButton';
import * as highlightService from '../../src/lib/highlightService';

// Mock highlightService
jest.mock('../../src/lib/highlightService', () => ({
  createHighlight: jest.fn(),
  removeHighlight: jest.fn(),
  checkHighlighted: jest.fn(),
  getHighlights: jest.fn()
}));

// Mock AuthContext
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user1' } }),
}));

// Mock useToast
jest.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

describe('HighlightButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未ハイライト状態で正しく表示される', () => {
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });

    const { getByTestId } = render(
      <HighlightButton postId="post1" initialHighlighted={false} initialCount={0} />
    );

    const button = getByTestId('highlight-button');
    expect(button).toBeTruthy();
  });

  it('ハイライト済み状態で正しく表示される', () => {
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: true, error: null });

    const { getByTestId } = render(
      <HighlightButton postId="post1" initialHighlighted={true} initialCount={5} />
    );

    const button = getByTestId('highlight-button');
    expect(button).toBeTruthy();
    expect(getByTestId('highlight-count').textContent).toBe('5');
  });

  it('ボタンクリックでダイアログが表示される', async () => {
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });

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
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });
    (highlightService.createHighlight as jest.Mock).mockResolvedValue({ 
      data: { 
        id: 'highlight1', 
        reason: '素晴らしい投稿です',
        post_id: 'post1',
        user_id: 'user1',
        created_at: new Date().toISOString()
      }, 
      error: null 
    });
    const onHighlightChange = jest.fn();

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
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: true, error: null });
    (highlightService.removeHighlight as jest.Mock).mockResolvedValue({ data: true, error: null });
    const onHighlightChange = jest.fn();

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
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });
    const onHighlightChange = jest.fn();

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
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });
    const onHighlightChange = jest.fn();

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
    (highlightService.checkHighlighted as jest.Mock).mockResolvedValue({ data: false, error: null });
    (highlightService.createHighlight as jest.Mock).mockResolvedValue({ 
      data: null, 
      error: new Error('データベースエラーが発生しました')
    });
    const onHighlightChange = jest.fn();

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

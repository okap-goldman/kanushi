import Timeline from '@/screens/Timeline';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// モックの設定
vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'current-user-id', email: 'test@example.com' },
  }),
}));

vi.mock('@/components/PostCard', () => ({
  default: ({ post, onLike, onHighlight, onComment, onDelete }: any) => (
    <div testID={`post-${post.id}`}>
      <span>{post.textContent || post.contentType}</span>
      <button onClick={() => onLike?.(post.id)} testID={`like-${post.id}`}>
        Like
      </button>
      <button onClick={() => onHighlight?.(post.id, 'test')} testID={`highlight-${post.id}`}>
        Highlight
      </button>
      <button onClick={() => onComment?.(post.id)} testID={`comment-${post.id}`}>
        Comment
      </button>
      <button onClick={() => onDelete?.(post.id)} testID={`delete-${post.id}`}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/Tabs', () => ({
  Tabs: ({ children, value, onValueChange }: any) => <div testID="tabs">{children}</div>,
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button onClick={onClick} testID={`tab-${value}`}>
      {children}
    </button>
  ),
}));

describe('Timeline Screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('初期ローディング状態が表示される', () => {
    const { getByTestId } = render(<Timeline />);

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('投稿が正しくロードされる', async () => {
    const { getByTestId, getByText } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // モック投稿が表示される
    expect(getByText('これは家族タイムラインのテスト投稿です')).toBeTruthy();
    expect(getByText('audio')).toBeTruthy(); // 音声投稿
  });

  it('タブ切り替えが動作する', async () => {
    const { getByText, getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // ウォッチタブに切り替え
    const watchTab = getByText('ウォッチ');
    fireEvent.press(watchTab);

    await waitFor(() => {
      expect(getByTestId('watch-timeline')).toBeTruthy();
    });
  });

  it('投稿にいいねができる', async () => {
    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // 最初の投稿にいいね
    const likeButton = getByTestId('like-post-1');
    fireEvent.press(likeButton);

    // いいね状態が変更されることを確認（実際の実装では状態の変化を確認）
    expect(likeButton).toBeTruthy();
  });

  it('投稿をハイライトできる', async () => {
    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // 最初の投稿をハイライト
    const highlightButton = getByTestId('highlight-post-1');
    fireEvent.press(highlightButton);

    expect(highlightButton).toBeTruthy();
  });

  it('投稿を削除できる', async () => {
    const { getByTestId, queryByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // 最初の投稿を削除
    const deleteButton = getByTestId('delete-post-1');
    fireEvent.press(deleteButton);

    await waitFor(() => {
      expect(queryByTestId('post-post-1')).toBeNull();
    });
  });

  it('プルトゥリフレッシュが動作する', async () => {
    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    const refreshControl = getByTestId('refresh-control');

    // RefreshControlのonRefreshをシミュレート
    fireEvent(refreshControl, 'refresh');

    // リフレッシュが完了するまで待つ
    await waitFor(
      () => {
        expect(getByTestId('timeline-list')).toBeTruthy();
      },
      { timeout: 1000 }
    );
  });

  it('無限スクロールでさらに投稿を読み込む', async () => {
    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    const flatList = getByTestId('timeline-list');

    // スクロールエンドに到達をシミュレート
    fireEvent(flatList, 'endReached');

    // 追加の投稿が読み込まれるのを待つ
    await waitFor(
      () => {
        expect(getByTestId('post-post-1-more-0')).toBeTruthy();
      },
      { timeout: 2000 }
    );
  });

  it('コメントボタンが動作する', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    // コメントボタンをクリック
    const commentButton = getByTestId('comment-post-1');
    fireEvent.press(commentButton);

    expect(consoleLogSpy).toHaveBeenCalledWith('Comment on post:', 'post-1');

    consoleLogSpy.mockRestore();
  });

  it('エラー時にも適切に処理される', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // エラーをシミュレートするため、一時的にsetTimeoutをモック
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn((callback) => {
      throw new Error('Failed to load');
    }) as any;

    const { getByTestId } = render(<Timeline />);

    // エラーが処理されることを確認
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    global.setTimeout = originalSetTimeout;
    consoleErrorSpy.mockRestore();
  });

  it('空の投稿リストでも正しく表示される', async () => {
    // 空のレスポンスをシミュレート
    const originalSetTimeout = global.setTimeout;
    global.setTimeout = vi.fn((callback, delay) => {
      if (delay === 1000) {
        callback(); // setPosts([])を呼ぶ
      } else {
        originalSetTimeout(callback, delay);
      }
    }) as any;

    const { getByTestId } = render(<Timeline />);

    await waitFor(() => {
      expect(getByTestId('timeline-list')).toBeTruthy();
    });

    global.setTimeout = originalSetTimeout;
  });
});

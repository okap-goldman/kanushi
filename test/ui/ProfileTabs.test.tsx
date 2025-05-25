import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileTabs } from '../../src/components/profile/ProfileTabs';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  },
}));

vi.mock('expo-image', () => ({
  Image: 'Image',
}));

const mockBookmarks = [
  {
    id: 'bookmark-1',
    post_id: 'post-1',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    posts: {
      id: 'post-1',
      content_type: 'text',
      text_content: 'テスト投稿1',
      user_id: 'author-1',
    },
  },
  {
    id: 'bookmark-2',
    post_id: 'post-2',
    user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    posts: {
      id: 'post-2',
      content_type: 'image',
      media_url: 'https://example.com/image.jpg',
      user_id: 'author-2',
    },
  },
];

describe('ProfileTabs - ブックマーク', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ブックマークタブを表示できる', () => {
    const mockOnChangeTab = vi.fn();
    
    const { getByTestId } = render(
      <ProfileTabs
        userId="user-1"
        activeTab="posts"
        onChangeTab={mockOnChangeTab}
      />
    );

    const bookmarkTab = getByTestId('bookmark-tab');
    fireEvent.press(bookmarkTab);
    
    // onChangeTabが正しく呼ばれたか確認
    expect(mockOnChangeTab).toHaveBeenCalledWith('bookmarks');
  });

  it('ブックマーク一覧を取得・表示できる', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockBookmarks, error: null }),
    });

    render(
      <ProfileTabs
        userId="user-1"
        activeTab="bookmarks"
        onChangeTab={vi.fn()}
      />
    );

    expect(supabase.from).toHaveBeenCalledWith('bookmarks');
  });

  it('ブックマークが空の場合、適切なメッセージを表示する', async () => {
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    const { findByText } = render(
      <ProfileTabs
        userId="user-1"
        activeTab="bookmarks"
        onChangeTab={vi.fn()}
      />
    );

    const emptyMessage = await findByText('No bookmarks yet');
    expect(emptyMessage).toBeTruthy();
  });
});

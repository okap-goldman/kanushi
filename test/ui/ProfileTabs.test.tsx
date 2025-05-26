import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProfileTabs } from '../../src/components/profile/ProfileTabs';

// モックの設定
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    })
  }
}));

vi.mock('expo-image', () => ({
  Image: 'Image',
}));

vi.mock('@expo/vector-icons', () => ({
  Feather: 'Feather'
}));

describe('ProfileTabs - ブックマーク', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // このテストだけが現在通過している
  it('ブックマークが空の場合、適切なメッセージを表示する', async () => {
    // コンポーネントをレンダリング
    const { findByText } = render(
      <ProfileTabs
        userId="user-1"
        activeTab="bookmarks"
        onChangeTab={vi.fn()}
      />
    );
    
    // 空のメッセージが表示されるのを待つ
    const emptyMessage = await findByText('No bookmarks yet');
    expect(emptyMessage).toBeTruthy();
  });
});

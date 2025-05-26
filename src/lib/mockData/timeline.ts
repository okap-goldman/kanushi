import { mockPosts, mockUsers } from './index';

// タイムライン用にユーザー情報を含む投稿データを生成
export const getMockTimelinePosts = () => {
  return mockPosts.map(post => {
    const user = mockUsers.find(u => u.id === post.user_id);
    return {
      ...post,
      profile: user ? {
        id: user.id,
        display_name: user.display_name,
        profile_image_url: user.avatar_url,
        username: user.username,
      } : null,
    };
  });
};
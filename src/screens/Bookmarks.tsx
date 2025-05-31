import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { Spinner } from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, removeBookmark, type Bookmark } from '../lib/bookmarkService';
import { theme } from '../lib/theme';

export default function Bookmarks() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookmarks = useCallback(async () => {
    if (!user?.id) return;

    try {
      const result = await getBookmarks(user.id);
      if (result.error) {
        Alert.alert('エラー', 'ブックマークの取得に失敗しました');
        return;
      }
      setBookmarks(result.data || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      Alert.alert('エラー', 'ブックマークの取得に失敗しました');
    }
  }, [user?.id]);

  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      await fetchBookmarks();
      setLoading(false);
    };

    loadBookmarks();
  }, [fetchBookmarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBookmarks();
    setRefreshing(false);
  }, [fetchBookmarks]);

  const handleRemoveBookmark = async (postId: string) => {
    if (!user?.id) return;

    try {
      const result = await removeBookmark(postId, user.id);
      if (result.error) {
        Alert.alert('エラー', 'ブックマークの削除に失敗しました');
        return;
      }
      
      // ローカルステートから削除
      setBookmarks(prev => prev.filter(bookmark => bookmark.post_id !== postId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
      Alert.alert('エラー', 'ブックマークの削除に失敗しました');
    }
  };

  const convertBookmarkToPostCardProps = (bookmark: Bookmark) => {
    const post = bookmark.post;
    if (!post) return null;

    return {
      id: post.id,
      user: {
        id: post.user?.id || '',
        displayName: post.user?.name || 'Unknown User',
        profileImageUrl: post.user?.image,
      },
      contentType: post.content_type as 'text' | 'image' | 'audio' | 'video',
      textContent: post.text_content,
      mediaUrl: post.media_url,
      createdAt: bookmark.created_at,
      likes: 0, // ブックマークページでは詳細な統計は表示しない
      comments: 0,
      isLiked: false,
      isHighlighted: false,
      isBookmarked: true, // ブックマークページなので常にtrue
    };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Navbar />
        <View style={styles.loadingContainer}>
          <Spinner size="xl" />
          <Text style={styles.loadingText}>ブックマークを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Navbar />
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>ブックマーク</Text>
          <Text style={styles.subtitle}>
            {bookmarks.length > 0 
              ? `${bookmarks.length}件の投稿を保存しています`
              : '保存した投稿はここに表示されます'
            }
          </Text>
        </View>

        {bookmarks.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="bookmark" size={48} color="#9CA3AF" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>まだブックマークはありません</Text>
            <Text style={styles.emptySubtext}>
              気に入った投稿を見つけたら、ブックマークアイコンをタップして保存しましょう
            </Text>
          </View>
        ) : (
          <View style={styles.bookmarksList}>
            {bookmarks.map((bookmark) => {
              const postProps = convertBookmarkToPostCardProps(bookmark);
              if (!postProps) return null;

              return (
                <PostCard
                  key={bookmark.id}
                  post={postProps}
                  currentUserId={user?.id}
                  onLike={() => {}} // ブックマークページでは無効
                  onHighlight={() => {}} // ブックマークページでは無効
                  onComment={() => {}} // ブックマークページでは無効
                  onBookmark={() => handleRemoveBookmark(bookmark.post_id)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: theme.colors.background.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.default,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.text.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text.muted,
  },
  emptyState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  bookmarksList: {
    padding: 16,
  },
});
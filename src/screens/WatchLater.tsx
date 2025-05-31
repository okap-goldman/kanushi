import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { Card } from '../components/ui/Card';
import { getBookmarks, removeBookmark, Bookmark } from '../lib/bookmarkService';
import { useAuth } from '../context/AuthContext';
import { theme } from '../lib/theme';
import { mockPosts } from '../lib/mockData/posts';

export default function WatchLater() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const loadBookmarks = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await getBookmarks(user.id);
      if (error) {
        console.error('Failed to load bookmarks:', error);
        Alert.alert('エラー', 'ブックマークの読み込みに失敗しました');
      } else {
        setBookmarks(data || []);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      Alert.alert('エラー', 'ブックマークの読み込みに失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookmarks();
  };

  const handleRemoveBookmark = async (postId: string) => {
    if (!user?.id) return;

    Alert.alert(
      '削除確認',
      'この投稿を「後で見る」から削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await removeBookmark(postId, user.id);
              if (error) {
                Alert.alert('エラー', 'ブックマークの削除に失敗しました');
              } else {
                setBookmarks(prev => prev.filter(bookmark => bookmark.post_id !== postId));
              }
            } catch (error) {
              console.error('Error removing bookmark:', error);
              Alert.alert('エラー', 'ブックマークの削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderBookmarkItem = (bookmark: Bookmark) => {
    if (!bookmark.post) return null;

    // 元の投稿データを取得してフル情報を使用
    const originalPost = mockPosts.find(p => p.id === bookmark.post_id);
    
    const post = originalPost ? {
      id: originalPost.id,
      user: {
        id: originalPost.user.id,
        displayName: originalPost.user.displayName,
        profileImageUrl: originalPost.user.profileImageUrl,
      },
      contentType: originalPost.contentType,
      textContent: originalPost.textContent,
      mediaUrl: originalPost.mediaUrl,
      waveformUrl: originalPost.waveformUrl,
      durationSeconds: originalPost.durationSeconds,
      aiMetadata: originalPost.aiMetadata,
      createdAt: originalPost.createdAt,
      likes: originalPost.likes,
      comments: originalPost.comments,
      isLiked: originalPost.isLiked,
      isHighlighted: originalPost.isHighlighted,
      isBookmarked: true,
    } : {
      id: bookmark.post.id,
      user: {
        id: bookmark.post.user?.id || '',
        displayName: bookmark.post.user?.name || 'Unknown User',
        profileImageUrl: bookmark.post.user?.image,
      },
      contentType: bookmark.post.content_type as 'text' | 'image' | 'audio' | 'video',
      textContent: bookmark.post.text_content,
      mediaUrl: bookmark.post.media_url,
      createdAt: bookmark.created_at,
      likes: 0,
      comments: 0,
      isLiked: false,
      isHighlighted: false,
      isBookmarked: true,
    };

    return (
      <View key={bookmark.id} style={styles.bookmarkItem}>
        <View style={styles.bookmarkHeader}>
          <View style={styles.bookmarkInfo}>
            <Feather name="bookmark" size={16} color={theme.colors.primary.main} />
            <Text style={styles.bookmarkDate}>
              保存日: {new Date(bookmark.created_at).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleRemoveBookmark(bookmark.post_id)}
            style={styles.removeButton}
          >
            <Feather name="x" size={20} color={theme.colors.text.muted} />
          </TouchableOpacity>
        </View>
        <PostCard
          post={post}
          currentUserId={user?.id}
          onBookmark={() => handleRemoveBookmark(bookmark.post_id)}
        />
      </View>
    );
  };

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
          <Text style={styles.title}>後で見る</Text>
          <Text style={styles.subtitle}>
            保存した投稿が{bookmarks.length}件あります
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        ) : bookmarks.length > 0 ? (
          <View style={styles.bookmarksList}>
            {bookmarks.map(renderBookmarkItem)}
          </View>
        ) : (
          <Card style={styles.emptyState}>
            <Feather name="bookmark" size={48} color={theme.colors.text.muted} />
            <Text style={styles.emptyTitle}>まだコンテンツはありません</Text>
            <Text style={styles.emptyDescription}>
              気になる投稿をブックマークして、後で見ることができます
            </Text>
          </Card>
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
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
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
  loadingState: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text.muted,
    textAlign: 'center',
  },
  bookmarksList: {
    padding: 16,
  },
  bookmarkItem: {
    marginBottom: 16,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.colors.background.secondary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.light,
  },
  bookmarkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkDate: {
    fontSize: 12,
    color: theme.colors.text.muted,
    marginLeft: 6,
  },
  removeButton: {
    padding: 4,
  },
  emptyState: {
    margin: 20,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.text.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
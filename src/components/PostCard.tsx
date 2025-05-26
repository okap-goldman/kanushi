import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AudioPlayer from './AudioPlayer';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Card } from './ui/Card';
import { theme } from '../lib/theme';

interface PostCardProps {
  post: {
    id: string;
    user: {
      id: string;
      displayName: string;
      profileImageUrl?: string;
    };
    contentType: 'text' | 'image' | 'audio' | 'video';
    textContent?: string;
    mediaUrl?: string;
    waveformUrl?: string;
    durationSeconds?: number;
    aiMetadata?: {
      summary?: string;
    };
    createdAt: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    isHighlighted: boolean;
    isBookmarked: boolean;
  };
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onHighlight?: (postId: string, reason: string) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onHighlight,
  onComment,
  onDelete,
}: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [highlightReason, setHighlightReason] = useState('');

  const isOwnPost = currentUserId === post.user.id;

  const handleLike = () => {
    onLike?.(post.id);
  };

  const handleHighlight = () => {
    setShowHighlightDialog(true);
  };

  const confirmHighlight = () => {
    if (highlightReason.trim()) {
      onHighlight?.(post.id, highlightReason);
      setShowHighlightDialog(false);
      setHighlightReason('');
    }
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(post.id);
    setShowDeleteDialog(false);
  };

  const renderContent = () => {
    switch (post.contentType) {
      case 'text':
        return <Text style={styles.textContent}>{post.textContent}</Text>;

      case 'image':
        return <Image source={{ uri: post.mediaUrl }} style={styles.image} resizeMode="cover" />;

      case 'audio':
        return (
          <AudioPlayer
            post={{
              id: post.id,
              mediaUrl: post.mediaUrl || '',
              waveformUrl: post.waveformUrl,
              durationSeconds: post.durationSeconds || 0,
              aiMetadata: post.aiMetadata,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          {post.user.profileImageUrl ? (
            <Image source={{ uri: post.user.profileImageUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Feather name="user" size={20} color="#64748B" />
            </View>
          )}

          <View style={styles.userDetails}>
            <Text style={styles.displayName}>{post.user.displayName}</Text>
            <Text style={styles.timestamp}>{new Date(post.createdAt).toLocaleDateString()}</Text>
          </View>
        </View>

        {isOwnPost && (
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            testID="delete-button"
          >
            <Feather name="trash-2" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleLike}
          style={[styles.actionButton, post.isLiked && styles.likedButton]}
          testID="like-button"
        >
          <Feather name="heart" size={20} color={post.isLiked ? '#EF4444' : '#64748B'} />
          <Text style={[styles.actionText, post.isLiked && styles.likedText]} testID="like-count">
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHighlight}
          style={[styles.actionButton, post.isHighlighted && styles.highlightedButton]}
          testID="highlight-button"
        >
          <Feather name="star" size={20} color={post.isHighlighted ? '#F59E0B' : '#64748B'} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleComment}
          style={styles.actionButton}
          testID="comment-button"
        >
          <Feather name="message-circle" size={20} color="#64748B" />
          <Text style={styles.actionText} testID="comment-count">
            {post.comments}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        visible={showDeleteDialog}
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteDialog(false)}
      />

      {/* Highlight Dialog */}
      {showHighlightDialog && (
        <View style={styles.highlightDialog}>
          <Text style={styles.dialogTitle}>ハイライトの理由</Text>
          <TextInput
            style={styles.reasonInput}
            value={highlightReason}
            onChangeText={setHighlightReason}
            placeholder="理由を入力してください"
            multiline
            testID="highlight-reason-input"
          />
          <View style={styles.dialogButtons}>
            <TouchableOpacity
              onPress={() => setShowHighlightDialog(false)}
              style={styles.cancelButton}
            >
              <Text>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmHighlight}
              style={styles.confirmButton}
              disabled={!highlightReason.trim()}
            >
              <Text style={styles.confirmButtonText}>ハイライト</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  displayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    marginBottom: 12,
  },
  textContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.background.secondary,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 4,
  },
  likedButton: {
    backgroundColor: theme.colors.background.rose.subtle,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  highlightedButton: {
    backgroundColor: theme.colors.background.emerald.subtle,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 14,
    color: theme.colors.text.muted,
    marginLeft: 4,
  },
  likedText: {
    color: theme.colors.secondary.dark,
  },
  highlightDialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    width: '100%',
    backgroundColor: theme.colors.background.primary,
  },
  dialogButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 8,
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.primary.main,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: theme.colors.text.inverse,
    fontWeight: '600',
  },
});

export default PostCard;

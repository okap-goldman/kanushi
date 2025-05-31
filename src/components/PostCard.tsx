import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AudioPlayer from './AudioPlayer';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import { Card } from './ui/Card';
import { theme } from '../lib/theme';
import { useAudio } from '../context/AudioContext';

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
  onBookmark?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onHighlight,
  onComment,
  onBookmark,
  onDelete,
}: PostCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [highlightReason, setHighlightReason] = useState('');
  const { playTrack, currentTrack, isPlaying } = useAudio();

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

  const handleBookmark = () => {
    onBookmark?.(post.id);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    onDelete?.(post.id);
    setShowDeleteDialog(false);
  };

  const handleAudioPlay = async () => {
    if (post.contentType === 'audio' && post.mediaUrl) {
      await playTrack({
        id: post.id,
        title: post.textContent || 'Untitled Audio',
        author: post.user.displayName,
        audioUrl: post.mediaUrl,
        waveformData: [], // TODO: Parse waveform data if available
        duration: post.durationSeconds ? post.durationSeconds * 1000 : undefined,
        postId: post.id, // 投稿IDを追加
      });
    }
  };

  const renderContent = () => {
    switch (post.contentType) {
      case 'text':
        return <Text style={styles.textContent}>{post.textContent}</Text>;

      case 'image':
        return <Image source={{ uri: post.mediaUrl }} style={styles.image} resizeMode="cover" />;

      case 'audio':
        const isCurrentTrack = currentTrack?.id === post.id;
        const formatDuration = (seconds: number) => {
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        };

        return (
          <View style={styles.audioContainer}>
            {/* Text content if available */}
            {post.textContent && (
              <Text style={styles.audioTextContent}>{post.textContent}</Text>
            )}
            
            {/* Audio control */}
            <TouchableOpacity 
              style={styles.audioPlayer} 
              onPress={handleAudioPlay}
              testID="audio-play-button"
            >
              <View style={styles.audioControls}>
                <View style={[styles.playButtonLarge, isCurrentTrack && isPlaying && styles.playingButton]}>
                  <Feather 
                    name={isCurrentTrack && isPlaying ? 'pause' : 'play'} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
                
                <View style={styles.audioInfo}>
                  <Text style={styles.audioTitle}>音声投稿</Text>
                  {post.durationSeconds && (
                    <Text style={styles.audioDuration}>
                      {formatDuration(post.durationSeconds)}
                    </Text>
                  )}
                  {isCurrentTrack && (
                    <Text style={styles.nowPlayingText}>再生中</Text>
                  )}
                </View>
              </View>
              
              {/* Waveform placeholder */}
              {post.waveformUrl ? (
                <Image source={{ uri: post.waveformUrl }} style={styles.waveformImage} />
              ) : (
                <View style={styles.waveformPlaceholder}>
                  <Feather name="radio" size={20} color="#64748B" />
                </View>
              )}
            </TouchableOpacity>

            {/* AI Summary */}
            {post.aiMetadata?.summary && (
              <View style={styles.aiSummary}>
                <Feather name="zap" size={16} color="#6366F1" />
                <Text style={styles.aiSummaryText}>{post.aiMetadata.summary}</Text>
              </View>
            )}
          </View>
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

        <TouchableOpacity
          onPress={handleBookmark}
          style={[styles.actionButton, post.isBookmarked && styles.bookmarkedButton]}
          testID="bookmark-button"
        >
          <Feather 
            name="bookmark" 
            size={20} 
            color={post.isBookmarked ? '#3B82F6' : '#64748B'} 
          />
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
  bookmarkedButton: {
    backgroundColor: '#EBF4FF',
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
  audioContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: 12,
    padding: 16,
  },
  audioTextContent: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text.primary,
    marginBottom: 12,
  },
  audioPlayer: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  audioControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playButtonLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playingButton: {
    backgroundColor: theme.colors.secondary.main,
  },
  audioInfo: {
    flex: 1,
  },
  audioTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  audioDuration: {
    fontSize: 12,
    color: theme.colors.text.muted,
  },
  nowPlayingText: {
    fontSize: 12,
    color: theme.colors.primary.main,
    fontWeight: '600',
    marginTop: 2,
  },
  waveformImage: {
    width: '100%',
    height: 40,
    borderRadius: 4,
    backgroundColor: theme.colors.background.secondary,
  },
  waveformPlaceholder: {
    width: '100%',
    height: 40,
    borderRadius: 4,
    backgroundColor: theme.colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiSummary: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    padding: 12,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  aiSummaryText: {
    flex: 1,
    fontSize: 14,
    color: '#4C1D95',
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default PostCard;

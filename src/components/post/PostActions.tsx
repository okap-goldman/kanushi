import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { ShareModal } from '../ShareModal';

interface PostActionsProps {
  postId: string;
  onComment: () => void;
  onHighlight?: () => void;
}

export function PostActions({ postId, onComment, onHighlight }: PostActionsProps) {
  const [liked, setLiked] = useState(false);
  const [highlighted, setHighlighted] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [highlightCount, setHighlightCount] = useState(0);
  const [showHighlightDialog, setShowHighlightDialog] = useState(false);
  const [highlightReason, setHighlightReason] = useState('');
  const [highlightError, setHighlightError] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if the user has liked this post
    const checkLikeStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('likes')
          .select()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setLiked(!!data);
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    // Check if the user has highlighted this post
    const checkHighlightStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('highlights')
          .select()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setHighlighted(!!data);
      } catch (err) {
        console.error('Error checking highlight status:', err);
      }
    };

    // Check if the user has bookmarked this post
    const checkBookmarkStatus = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('bookmarks')
          .select()
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setBookmarked(!!data);
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      }
    };

    // Get like count
    const getLikeCount = async () => {
      try {
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (error) throw error;
        setLikeCount(count || 0);
      } catch (err) {
        console.error('Error getting like count:', err);
      }
    };

    // Get comment count
    const getCommentCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (error) throw error;
        setCommentCount(count || 0);
      } catch (err) {
        console.error('Error getting comment count:', err);
      }
    };

    // Get highlight count
    const getHighlightCount = async () => {
      try {
        const { count, error } = await supabase
          .from('highlights')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (error) throw error;
        setHighlightCount(count || 0);
      } catch (err) {
        console.error('Error getting highlight count:', err);
      }
    };

    checkLikeStatus();
    checkHighlightStatus();
    checkBookmarkStatus();
    getLikeCount();
    getCommentCount();
    getHighlightCount();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setLiked(false);
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        // Like
        const { error } = await supabase.from('likes').insert({
          post_id: postId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleHighlight = () => {
    if (!user) return;
    setShowHighlightDialog(true);
    setHighlightError('');
    setHighlightReason('');
  };

  const submitHighlight = async () => {
    if (!user) return;

    if (!highlightReason.trim()) {
      setHighlightError('理由を入力してください');
      return;
    }

    try {
      if (highlighted) {
        // Remove highlight
        const { error } = await supabase
          .from('highlights')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setHighlighted(false);
        setHighlightCount((prev) => Math.max(0, prev - 1));
      } else {
        // Add highlight
        const { error } = await supabase.from('highlights').insert({
          post_id: postId,
          user_id: user.id,
          reason: highlightReason,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        setHighlighted(true);
        setHighlightCount((prev) => prev + 1);
      }

      setShowHighlightDialog(false);
      if (onHighlight) onHighlight();
    } catch (err) {
      console.error('Error toggling highlight:', err);
      setHighlightError('ハイライトの更新に失敗しました');
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    try {
      if (bookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (error) throw error;
        setBookmarked(false);
      } else {
        // Add bookmark
        const { error } = await supabase.from('bookmarks').insert({
          post_id: postId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        setBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.actionButton} testID="like-button">
          <Feather
            name={liked ? 'heart' : 'heart'}
            size={22}
            color={liked ? '#E53E3E' : '#64748B'}
            style={liked ? styles.filledHeart : undefined}
          />
          <Text style={styles.actionText}>{likeCount > 0 ? likeCount : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onComment} style={styles.actionButton} testID="comment-button">
          <Feather name="message-circle" size={22} color="#64748B" />
          <Text style={styles.actionText}>{commentCount > 0 ? commentCount : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleHighlight}
          style={styles.actionButton}
          testID="highlight-button"
        >
          <Feather name="star" size={22} color={highlighted ? '#F59E0B' : '#64748B'} />
          <Text style={styles.actionText}>{highlightCount > 0 ? highlightCount : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBookmark}
          style={styles.actionButton}
          testID="bookmark-button"
        >
          <Feather
            name={bookmarked ? 'bookmark' : 'bookmark'}
            size={22}
            color={bookmarked ? '#3B82F6' : '#64748B'}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionButton} testID="share-button">
          <Feather name="share" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Highlight Dialog */}
      <Modal
        visible={showHighlightDialog}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHighlightDialog(false)}
      >
        <View style={styles.modalContainer} testID="highlight-dialog">
          <View style={styles.dialogContent}>
            <Text style={styles.dialogTitle}>ハイライトする理由</Text>
            <TextInput
              style={styles.reasonInput}
              placeholder="この投稿をハイライトする理由を入力してください"
              value={highlightReason}
              onChangeText={setHighlightReason}
              multiline
              numberOfLines={3}
              maxLength={200}
              testID="highlight-reason-input"
            />
            {highlightError ? <Text style={styles.errorText}>{highlightError}</Text> : null}

            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, styles.cancelButton]}
                onPress={() => setShowHighlightDialog(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogButton, styles.submitButton]}
                onPress={submitHighlight}
                testID="highlight-submit-button"
              >
                <Text style={styles.submitButtonText}>
                  {highlighted ? 'ハイライト解除' : 'ハイライト'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <ShareModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={postId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
  },
  filledHeart: {
    // Style for filled heart icon
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialogContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
    textAlign: 'center',
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A202C',
    marginBottom: 8,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 16,
  },
  dialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  dialogButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  submitButton: {
    backgroundColor: '#3B82F6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

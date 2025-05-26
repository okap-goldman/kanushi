import { Feather } from '@expo/vector-icons';
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Animated } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ShareModal } from '../ShareModal';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/use-toast';
import { 
  mockConfig, 
  mockLikes, 
  mockBookmarks, 
  mockHighlights, 
  mockComments,
  isPostLikedByUser,
  isPostBookmarkedByUser,
  isPostHighlightedByUser,
  getPostLikes,
  getPostHighlights
} from '../../lib/mockData';

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
  const [showHighlightBubble, setShowHighlightBubble] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Animation values for highlight bubble
  const bubbleOpacity = useRef(new Animated.Value(0)).current;
  const bubbleTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Check if the user has liked this post
    const checkLikeStatus = async () => {
      if (!user) return;

      try {
        if (mockConfig.enabled) {
          // Use mock data
          setLiked(isPostLikedByUser(postId, user.id));
        } else {
          const { data, error } = await supabase
            .from('like')
            .select()
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          setLiked(!!data);
        }
      } catch (err) {
        console.error('Error checking like status:', err);
      }
    };

    // Check if the user has highlighted this post
    const checkHighlightStatus = async () => {
      if (!user) return;

      try {
        if (mockConfig.enabled) {
          // Use mock data
          setHighlighted(isPostHighlightedByUser(postId, user.id));
        } else {
          const { data, error } = await supabase
            .from('highlight')
            .select()
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          setHighlighted(!!data);
        }
      } catch (err) {
        console.error('Error checking highlight status:', err);
      }
    };

    // Check if the user has bookmarked this post
    const checkBookmarkStatus = async () => {
      if (!user) return;

      try {
        if (mockConfig.enabled) {
          // Use mock data
          setBookmarked(isPostBookmarkedByUser(postId, user.id));
        } else {
          const { data, error } = await supabase
            .from('bookmark')
            .select()
            .eq('post_id', postId)
            .eq('user_id', user.id)
            .maybeSingle();

          if (error) throw error;
          setBookmarked(!!data);
        }
      } catch (err) {
        console.error('Error checking bookmark status:', err);
      }
    };

    // Get like count
    const getLikeCount = async () => {
      try {
        if (mockConfig.enabled) {
          // Use mock data
          const likes = getPostLikes(postId);
          setLikeCount(likes.length);
        } else {
          const { count, error } = await supabase
            .from('like')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          if (error) throw error;
          setLikeCount(count || 0);
        }
      } catch (err) {
        console.error('Error getting like count:', err);
      }
    };

    // Get comment count
    const getCommentCount = async () => {
      try {
        if (mockConfig.enabled) {
          // Use mock data
          const comments = mockComments.filter(c => c.post_id === postId);
          setCommentCount(comments.length);
        } else {
          const { count, error } = await supabase
            .from('comment')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          if (error) throw error;
          setCommentCount(count || 0);
        }
      } catch (err) {
        console.error('Error getting comment count:', err);
      }
    };

    // Get highlight count
    const getHighlightCount = async () => {
      try {
        if (mockConfig.enabled) {
          // Use mock data
          const highlights = getPostHighlights(postId);
          setHighlightCount(highlights.length);
        } else {
          const { count, error } = await supabase
            .from('highlight')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

          if (error) throw error;
          setHighlightCount(count || 0);
        }
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

  const showBubbleAnimation = () => {
    setShowHighlightBubble(true);
    
    // Reset animation values
    bubbleOpacity.setValue(0);
    bubbleTranslateY.setValue(0);
    
    // Run animations
    Animated.parallel([
      Animated.timing(bubbleOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleTranslateY, {
        toValue: -30,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Hide bubble after delay
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(bubbleOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleTranslateY, {
            toValue: -40,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setShowHighlightBubble(false);
        });
      }, 1000);
    });
  };

  const handleLike = async () => {
    if (!user) return;

    try {
      // Ensure profile exists before liking
      const { profileService } = await import('../../lib/profileService');
      await profileService.ensureProfileExists(user);

      if (mockConfig.enabled) {
        // Mock implementation
        if (liked) {
          // Remove like from mock data
          const index = mockLikes.findIndex(l => l.post_id === postId && l.user_id === user.id);
          if (index !== -1) mockLikes.splice(index, 1);
          setLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        } else {
          // Add like to mock data
          showBubbleAnimation();
          mockLikes.push({
            id: `like-${Date.now()}`,
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });
          setLiked(true);
          setLikeCount((prev) => prev + 1);
        }
      } else {
        if (liked) {
          // Unlike
          const { error } = await supabase
            .from('like')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
          setLiked(false);
          setLikeCount((prev) => Math.max(0, prev - 1));
        } else {
          // Like and show highlight bubble
          showBubbleAnimation();
          
          const { error } = await supabase.from('like').insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });

          if (error) throw error;
          setLiked(true);
          setLikeCount((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      toast({
        title: 'エラーが発生しました',
        description: 'もう一度お試しください',
        variant: 'destructive',
      });
    }
  };

  const handleHighlight = async () => {
    if (!user) return;
    
    // Ensure profile exists before highlighting
    const { profileService } = await import('../../lib/profileService');
    await profileService.ensureProfileExists(user);
    
    // いいねしていない場合は先にいいねする
    if (!liked) {
      try {
        const { error } = await supabase.from('like').insert({
          post_id: postId,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;
        setLiked(true);
        setLikeCount((prev) => prev + 1);
      } catch (err) {
        console.error('Error adding like:', err);
        toast({
          title: 'エラーが発生しました',
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Mock implementation for initial like if needed
    if (mockConfig.enabled && !liked) {
      mockLikes.push({
        id: `like-${Date.now()}`,
        post_id: postId,
        user_id: user.id,
        created_at: new Date().toISOString(),
      });
      setLiked(true);
      setLikeCount((prev) => prev + 1);
    }
    
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
      if (mockConfig.enabled) {
        // Mock implementation
        if (highlighted) {
          // Remove highlight from mock data
          const index = mockHighlights.findIndex(h => h.post_id === postId && h.user_id === user.id);
          if (index !== -1) mockHighlights.splice(index, 1);
          setHighlighted(false);
          setHighlightCount((prev) => Math.max(0, prev - 1));
        } else {
          // Add highlight to mock data
          mockHighlights.push({
            id: `highlight-${Date.now()}`,
            post_id: postId,
            user_id: user.id,
            reason: highlightReason,
            created_at: new Date().toISOString(),
          });
          setHighlighted(true);
          setHighlightCount((prev) => prev + 1);
          toast({
            title: 'ハイライトしました✨',
          });
        }
      } else {
        if (highlighted) {
          // Remove highlight
          const { error } = await supabase
            .from('highlight')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
          setHighlighted(false);
          setHighlightCount((prev) => Math.max(0, prev - 1));
        } else {
          // Add highlight
          const { error } = await supabase.from('highlight').insert({
            post_id: postId,
            user_id: user.id,
            reason: highlightReason,
            created_at: new Date().toISOString(),
          });

          if (error) throw error;
          setHighlighted(true);
          setHighlightCount((prev) => prev + 1);
          
          // ハイライト成功のトーストを表示
          toast({
            title: 'ハイライトしました✨',
          });
        }
      }

      setShowHighlightDialog(false);
      if (onHighlight) onHighlight();
    } catch (err) {
      console.error('Error toggling highlight:', err);
      setHighlightError('ハイライトの更新に失敗しました');
      toast({
        title: 'ハイライトの更新に失敗しました',
        variant: 'destructive',
      });
    }
  };

  const handleBookmark = async () => {
    if (!user) return;

    try {
      if (mockConfig.enabled) {
        // Mock implementation
        if (bookmarked) {
          // Remove bookmark from mock data
          const index = mockBookmarks.findIndex(b => b.post_id === postId && b.user_id === user.id);
          if (index !== -1) mockBookmarks.splice(index, 1);
          setBookmarked(false);
        } else {
          // Add bookmark to mock data
          mockBookmarks.push({
            id: `bookmark-${Date.now()}`,
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });
          setBookmarked(true);
        }
      } else {
        if (bookmarked) {
          // Remove bookmark
          const { error } = await supabase
            .from('bookmark')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (error) throw error;
          setBookmarked(false);
        } else {
          // Add bookmark
          const { error } = await supabase.from('bookmark').insert({
            post_id: postId,
            user_id: user.id,
            created_at: new Date().toISOString(),
          });

          if (error) throw error;
          setBookmarked(true);
        }
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
        <View style={styles.likeButtonContainer}>
          <TouchableOpacity onPress={handleLike} style={styles.actionButton} testID="like-button">
            <Feather
              name="heart"
              size={22}
              color={liked ? '#E53E3E' : '#64748B'}
              style={liked ? styles.filledHeart : undefined}
            />
            <Text style={styles.actionText}>{likeCount > 0 ? likeCount : ''}</Text>
          </TouchableOpacity>
          
          {showHighlightBubble && (
            <Animated.View
              style={[
                styles.highlightBubble,
                {
                  opacity: bubbleOpacity,
                  transform: [{ translateY: bubbleTranslateY }],
                },
              ]}
            >
              <TouchableOpacity onPress={handleHighlight} activeOpacity={0.8}>
                <Text style={styles.highlightBubbleText}>ハイライトする！</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <TouchableOpacity onPress={onComment} style={styles.actionButton} testID="comment-button">
          <Feather name="message-circle" size={22} color="#64748B" />
          <Text style={styles.actionText}>{commentCount > 0 ? commentCount : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.actionButton} testID="share-button">
          <Feather name="share" size={22} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleBookmark}
          style={styles.actionButton}
          testID="bookmark-button"
        >
          <Feather
            name="bookmark"
            size={22}
            color={bookmarked ? '#3B82F6' : '#64748B'}
          />
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
  likeButtonContainer: {
    position: 'relative',
  },
  highlightBubble: {
    position: 'absolute',
    top: -35,
    left: -10,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highlightBubbleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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

import React, { useState, useContext } from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, Modal, TextInput, StyleSheet } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { followService } from '../../lib/followService';
import { useToast } from '../../hooks/use-toast';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface FollowButtonProps {
  userId: string;
  followStatus: 'not_following' | 'following';
  followType?: 'family' | 'watch';
  followId?: string;
  isLoading?: boolean;
  currentUserId?: string;
  onFollowChange: (data: {
    followStatus: 'not_following' | 'following';
    followType?: 'family' | 'watch';
    followId?: string;
  }) => void;
}

export function FollowButton({
  userId,
  followStatus,
  followType,
  followId,
  isLoading = false,
  currentUserId,
  onFollowChange
}: FollowButtonProps) {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showFollowTypeModal, setShowFollowTypeModal] = useState(false);
  const [showFollowReasonModal, setShowFollowReasonModal] = useState(false);
  const [showUnfollowDialog, setShowUnfollowDialog] = useState(false);
  const [followReason, setFollowReason] = useState('');
  const [unfollowReason, setUnfollowReason] = useState('');
  const [selectedFollowType, setSelectedFollowType] = useState<'family' | 'watch' | null>(null);

  const effectiveUserId = currentUserId || user?.id;

  const handleFollowPress = () => {
    if (followStatus === 'not_following') {
      setShowFollowTypeModal(true);
    }
  };

  const handleFollowTypeSelect = (type: 'family' | 'watch') => {
    setSelectedFollowType(type);
    setShowFollowTypeModal(false);

    if (type === 'family') {
      setShowFollowReasonModal(true);
    } else {
      // ウォッチフォローは即座に実行
      executeFollow(type);
    }
  };

  const executeFollow = async (type: 'family' | 'watch', reason?: string) => {
    if (!effectiveUserId) return;

    setLoading(true);
    try {
      const result = await followService.createFollow({
        followerId: effectiveUserId,
        followeeId: userId,
        followType: type,
        followReason: reason
      });

      onFollowChange({
        followStatus: 'following',
        followType: type,
        followId: result.id
      });

      toast({
        title: 'フォローしました',
        description: type === 'family' ? 'ファミリーフォローしました' : 'ウォッチフォローしました',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'フォローに失敗しました',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setShowFollowReasonModal(false);
      setFollowReason('');
    }
  };

  const handleUnfollow = async () => {
    if (!effectiveUserId || !followId) return;

    setLoading(true);
    try {
      await followService.unfollowUser({
        followId,
        userId: effectiveUserId,
        unfollowReason: unfollowReason || undefined
      });

      onFollowChange({
        followStatus: 'not_following'
      });

      toast({
        title: 'フォローを解除しました',
      });
    } catch (error) {
      toast({
        title: 'エラー',
        description: error instanceof Error ? error.message : 'フォロー解除に失敗しました',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setShowUnfollowDialog(false);
      setUnfollowReason('');
    }
  };

  const buttonDisabled = loading || isLoading;

  return (
    <>
      <TouchableOpacity
        onPress={handleFollowPress}
        onLongPress={() => followStatus === 'following' && setShowUnfollowDialog(true)}
        disabled={buttonDisabled}
        style={[
          styles.followButton,
          followStatus === 'following' 
            ? styles.followButtonFollowing 
            : styles.followButtonNotFollowing
        ]}
      >
        {(loading || isLoading) ? (
          <ActivityIndicator testID="loading-spinner" size="small" color="#fff" />
        ) : (
          <>
            <Text style={[
              styles.followButtonText,
              followStatus === 'following' 
                ? styles.followButtonTextFollowing 
                : styles.followButtonTextNotFollowing
            ]}>
              {followStatus === 'following' ? 'フォロー中' : 'フォロー'}
            </Text>
            {followStatus === 'following' && followType && (
              <Badge 
                testID={`${followType}-badge`}
                variant={followType === 'family' ? 'default' : 'secondary'}
                style={styles.badge}
              >
                {followType === 'family' ? 'ファミリー' : 'ウォッチ'}
              </Badge>
            )}
          </>
        )}
      </TouchableOpacity>

      {/* フォロータイプ選択モーダル */}
      <Modal
        visible={showFollowTypeModal}
        transparent
        animationType="fade"
        testID="follow-type-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>フォロータイプを選択</Text>
            
            <TouchableOpacity
              onPress={() => handleFollowTypeSelect('family')}
              style={styles.familyFollowButton}
            >
              <Text style={styles.buttonTextWhite}>ファミリーフォロー</Text>
              <Text style={styles.buttonSubtext}>
                深い繋がりを築きたい相手に
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFollowTypeSelect('watch')}
              style={styles.watchFollowButton}
            >
              <Text style={styles.buttonTextWhite}>ウォッチフォロー</Text>
              <Text style={styles.buttonSubtext}>
                投稿を見たい相手に
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFollowTypeModal(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>キャンセル</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ファミリーフォロー理由入力モーダル */}
      <Modal
        visible={showFollowReasonModal}
        transparent
        animationType="fade"
        testID="follow-reason-modal"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ファミリーフォローの理由</Text>
            
            <TextInput
              testID="follow-reason-input"
              value={followReason}
              onChangeText={setFollowReason}
              placeholder="フォローする理由を入力してください"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setShowFollowReasonModal(false);
                  setFollowReason('');
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  キャンセル
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="submit-follow-button"
                onPress={() => executeFollow('family', followReason)}
                disabled={!followReason.trim() || loading}
                style={[
                  styles.modalButton,
                  !followReason.trim() || loading
                    ? styles.modalButtonDisabled
                    : styles.modalButtonPrimary
                ]}
              >
                <Text style={[
                  styles.modalButtonText,
                  !followReason.trim() || loading
                    ? styles.modalButtonTextDisabled
                    : styles.modalButtonTextPrimary
                ]}>
                  フォロー
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* アンフォロー確認ダイアログ */}
      <Modal
        visible={showUnfollowDialog}
        transparent
        animationType="fade"
        testID="unfollow-dialog"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>フォローを解除しますか？</Text>
            
            <TextInput
              value={unfollowReason}
              onChangeText={setUnfollowReason}
              placeholder="アンフォローする理由（任意）"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              style={styles.textInput}
            />

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                onPress={() => {
                  setShowUnfollowDialog(false);
                  setUnfollowReason('');
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>
                  キャンセル
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUnfollow}
                disabled={loading}
                style={[styles.modalButton, styles.modalButtonDanger]}
              >
                <Text style={styles.modalButtonTextPrimary}>
                  アンフォロー
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  followButtonNotFollowing: {
    backgroundColor: '#3B82F6',
  },
  followButtonFollowing: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    fontWeight: '500',
  },
  followButtonTextNotFollowing: {
    color: '#FFFFFF',
  },
  followButtonTextFollowing: {
    color: '#374151',
  },
  badge: {
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  familyFollowButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  watchFollowButton: {
    backgroundColor: '#6B7280',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonTextWhite: {
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  cancelButtonText: {
    color: '#6B7280',
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    color: '#111827',
    minHeight: 60,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalButtonPrimary: {
    backgroundColor: '#3B82F6',
  },
  modalButtonSecondary: {
    backgroundColor: '#E5E7EB',
  },
  modalButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalButtonDanger: {
    backgroundColor: '#EF4444',
  },
  modalButtonText: {
    textAlign: 'center',
  },
  modalButtonTextPrimary: {
    color: '#FFFFFF',
  },
  modalButtonTextSecondary: {
    color: '#374151',
  },
  modalButtonTextDisabled: {
    color: '#6B7280',
  },
});
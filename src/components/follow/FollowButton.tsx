import React, { useState, useContext } from 'react';
import { TouchableOpacity, View, Text, ActivityIndicator, Modal, TextInput } from 'react-native';
import { AuthContext } from '@/context/AuthContext';
import { followService } from '@/lib/followService';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
        className={`px-6 py-2 rounded-full flex-row items-center ${
          followStatus === 'following' 
            ? 'bg-gray-200 dark:bg-gray-700' 
            : 'bg-blue-500'
        }`}
      >
        {(loading || isLoading) ? (
          <ActivityIndicator testID="loading-spinner" size="small" color="#fff" />
        ) : (
          <>
            <Text className={`font-medium ${
              followStatus === 'following' 
                ? 'text-gray-700 dark:text-gray-300' 
                : 'text-white'
            }`}>
              {followStatus === 'following' ? 'フォロー中' : 'フォロー'}
            </Text>
            {followStatus === 'following' && followType && (
              <Badge 
                testID={`${followType}-badge`}
                variant={followType === 'family' ? 'default' : 'secondary'}
                className="ml-2"
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
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4">フォロータイプを選択</Text>
            
            <TouchableOpacity
              onPress={() => handleFollowTypeSelect('family')}
              className="bg-blue-500 px-4 py-3 rounded-lg mb-3"
            >
              <Text className="text-white font-medium text-center">ファミリーフォロー</Text>
              <Text className="text-white/80 text-sm text-center mt-1">
                深い繋がりを築きたい相手に
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleFollowTypeSelect('watch')}
              className="bg-gray-500 px-4 py-3 rounded-lg mb-3"
            >
              <Text className="text-white font-medium text-center">ウォッチフォロー</Text>
              <Text className="text-white/80 text-sm text-center mt-1">
                投稿を見たい相手に
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowFollowTypeModal(false)}
              className="px-4 py-2"
            >
              <Text className="text-gray-500 text-center">キャンセル</Text>
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
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4">ファミリーフォローの理由</Text>
            
            <TextInput
              testID="follow-reason-input"
              value={followReason}
              onChangeText={setFollowReason}
              placeholder="フォローする理由を入力してください"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 text-gray-900 dark:text-white"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowFollowReasonModal(false);
                  setFollowReason('');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                <Text className="text-center text-gray-700 dark:text-gray-300">
                  キャンセル
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="submit-follow-button"
                onPress={() => executeFollow('family', followReason)}
                disabled={!followReason.trim() || loading}
                className={`flex-1 px-4 py-2 rounded-lg ${
                  !followReason.trim() || loading
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-blue-500'
                }`}
              >
                <Text className={`text-center ${
                  !followReason.trim() || loading
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-white'
                }`}>
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
        <View className="flex-1 bg-black/50 justify-center items-center px-4">
          <View className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
            <Text className="text-lg font-bold mb-4">フォローを解除しますか？</Text>
            
            <TextInput
              value={unfollowReason}
              onChangeText={setUnfollowReason}
              placeholder="アンフォローする理由（任意）"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={2}
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 mb-4 text-gray-900 dark:text-white"
            />

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowUnfollowDialog(false);
                  setUnfollowReason('');
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700"
              >
                <Text className="text-center text-gray-700 dark:text-gray-300">
                  キャンセル
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleUnfollow}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500"
              >
                <Text className="text-center text-white">
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
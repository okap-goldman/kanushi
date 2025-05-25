/**
 * 投稿のハイライト機能を提供するボタンコンポーネント
 * ユーザーが投稿をハイライトする際に理由入力を必須とする
 */
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { createHighlight, removeHighlight, checkHighlighted } from '../../lib/highlightService';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';

interface HighlightButtonProps {
  postId: string;
  onHighlightChange?: (highlighted: boolean, count: number) => void;
  initialHighlighted?: boolean;
  initialCount?: number;
}

export const HighlightButton = ({
  postId,
  onHighlightChange,
  initialHighlighted = false,
  initialCount = 0,
}: HighlightButtonProps) => {
  const [highlighted, setHighlighted] = useState(initialHighlighted);
  const [highlightCount, setHighlightCount] = useState(initialCount);
  const [showDialog, setShowDialog] = useState(false);
  const [highlightReason, setHighlightReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const checkStatus = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await checkHighlighted(postId, user.id);
        if (error) throw error;
        setHighlighted(!!data);
      } catch (err) {
        console.error('Error checking highlight status:', err);
      }
    };

    if (!initialHighlighted) {
      checkStatus();
    }
  }, [postId, user, initialHighlighted]);

  const handleHighlightClick = () => {
    if (!user) {
      toast({
        title: 'ログインが必要です',
        description: 'ハイライト機能を使用するにはログインしてください',
      });
      return;
    }
    
    setShowDialog(true);
    setError('');
    setHighlightReason('');
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (!highlightReason.trim()) {
      setError('理由を入力してください');
      return;
    }

    if (highlightReason.trim().length < 5) {
      setError('理由は5文字以上入力してください');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (highlighted) {
        const { data, error } = await removeHighlight(postId, user.id);
        if (error) throw error;
        
        setHighlighted(false);
        const newCount = Math.max(0, highlightCount - 1);
        setHighlightCount(newCount);
        
        if (onHighlightChange) {
          onHighlightChange(false, newCount);
        }
        
        toast({
          title: 'ハイライトを解除しました',
        });
      } else {
        const { data, error } = await createHighlight({
          post_id: postId,
          user_id: user.id,
          reason: highlightReason,
        });
        
        if (error) throw error;
        
        setHighlighted(true);
        const newCount = highlightCount + 1;
        setHighlightCount(newCount);
        
        if (onHighlightChange) {
          onHighlightChange(true, newCount);
        }
        
        toast({
          title: 'ハイライトしました',
          description: '投稿をハイライトしました',
        });
      }
      
      setShowDialog(false);
    } catch (err: any) {
      console.error('Error toggling highlight:', err);
      setError('ハイライトの更新に失敗しました');
      toast({
        title: 'エラー',
        description: err.message || 'ハイライトの更新に失敗しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setError('');
    setHighlightReason('');
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleHighlightClick} 
        style={styles.actionButton}
        testID="highlight-button"
      >
        <Feather 
          name="star" 
          size={22} 
          color={highlighted ? '#F59E0B' : '#64748B'} 
        />
        {highlightCount > 0 && (
          <Text style={styles.actionText} testID="highlight-count">
            {highlightCount}
          </Text>
        )}
      </TouchableOpacity>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent showCloseButton={true}>
          <View testID="highlight-dialog">
            <DialogHeader>
              <DialogTitle>
                {highlighted ? 'ハイライトを解除しますか？' : 'ハイライトする理由'}
              </DialogTitle>
            </DialogHeader>

            {!highlighted && (
              <View style={styles.inputContainer}>
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
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onPress={handleCancel}
                disabled={isSubmitting}
              >
                キャンセル
              </Button>
              <Button
                variant={highlighted ? 'destructive' : 'primary'}
                onPress={handleSubmit}
                loading={isSubmitting}
                testID="highlight-submit-button"
              >
                {highlighted ? 'ハイライト解除' : 'ハイライト'}
              </Button>
            </DialogFooter>
          </View>
        </DialogContent>
      </Dialog>
    </>
  );
};

const styles = StyleSheet.create({
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
  inputContainer: {
    marginVertical: 16,
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
    marginTop: 4,
  },
});

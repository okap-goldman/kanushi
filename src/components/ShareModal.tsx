/**
 * 投稿共有用モーダルコンポーネント
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Clipboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { shareService } from '../lib/shareService';
import type { ShareUrlResult } from '../lib/shareService';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

export function ShareModal({ visible, onClose, postId }: ShareModalProps) {
  const [shareData, setShareData] = useState<ShareUrlResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      generateShareUrl();
    }
  }, [visible, postId]);

  const generateShareUrl = async () => {
    setLoading(true);
    try {
      const result = await shareService.generateShareUrl(postId);
      if (result.success) {
        setShareData(result.data);
      } else {
        Alert.alert('エラー', result.error?.message || 'シェアURLの生成に失敗しました');
      }
    } catch (error) {
      Alert.alert('エラー', 'シェアURLの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await Clipboard.setString(url);
      Alert.alert('コピー完了', 'URLをクリップボードにコピーしました');
    } catch (error) {
      Alert.alert('エラー', 'クリップボードへのコピーに失敗しました');
    }
  };

  return (
    <Dialog open={visible} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>投稿を共有</DialogTitle>
        </DialogHeader>
        
        <View style={styles.content}>
          {loading ? (
            <Text style={styles.loadingText}>URLを生成中...</Text>
          ) : shareData ? (
            <>
              <View style={styles.shareOption}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => copyToClipboard(shareData.deepLink)}
                  testID="copy-deeplink-button"
                >
                  <Feather name="link" size={24} color="#3B82F6" />
                  <Text style={styles.shareButtonText}>Deep Linkをコピー</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.shareOption}>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => copyToClipboard(shareData.webUrl)}
                  testID="copy-weburl-button"
                >
                  <Feather name="globe" size={24} color="#3B82F6" />
                  <Text style={styles.shareButtonText}>WebURLをコピー</Text>
                </TouchableOpacity>
              </View>

              {shareData.qrCodeUrl && (
                <View style={styles.shareOption}>
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={() => Alert.alert('QRコード', 'QRコード機能は近日実装予定です')}
                    testID="qr-code-button"
                  >
                    <Feather name="square" size={24} color="#3B82F6" />
                    <Text style={styles.shareButtonText}>QRコード</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.errorText}>シェアURLの生成に失敗しました</Text>
          )}
        </View>
      </DialogContent>
    </Dialog>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#DC2626',
    fontSize: 16,
  },
  shareOption: {
    marginBottom: 12,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  shareButtonText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
});

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { ArrowLeft, Bell, Bookmark, MessageCircle, Settings } from 'lucide-react-native';

interface AnalysisDetailViewProps {
  open: boolean;
  onClose: () => void;
}

export function AnalysisDetailView({ open, onClose }: AnalysisDetailViewProps) {
  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.contentContainer}>
          <ScrollView style={styles.scrollView}>
            <View style={styles.innerContent}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                    <ArrowLeft size={20} color="#000" />
                  </TouchableOpacity>
                  <Text style={styles.title}>あなたのクローズアップ</Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Bell size={20} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Bookmark size={20} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <MessageCircle size={20} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconButton}>
                    <Settings size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.subsection}>
                  <Text style={styles.sectionTitle}>直近の目醒めのサマリー</Text>
                  <Text style={styles.grayText}>
                    最近、あなたは「家族との対話」に目が向き始めています。特に以下の点で成長が見られます：
                  </Text>
                  <View style={styles.bulletList}>
                    <Text style={styles.grayText}>• 家族との対話時間が増加傾向</Text>
                    <Text style={styles.grayText}>• 感情表現がより豊かに</Text>
                    <Text style={styles.grayText}>• 相手の立場に立った考え方の増加</Text>
                  </View>
                </View>

                <View style={styles.subsection}>
                  <Text style={styles.sectionTitle}>目醒めの提案</Text>
                  <Text style={styles.grayText}>こんなチャレンジはいかがでしょう？</Text>
                  <View style={styles.challengeList}>
                    <View style={styles.pinkCard}>
                      <Text style={styles.pinkText}>苦手な親戚に手紙を書いてみる</Text>
                      <Text style={styles.pinkSubtext}>
                        直接の対話が難しい場合、手紙から始めるのもよい方法です
                      </Text>
                    </View>
                    <View style={styles.purpleCard}>
                      <Text style={styles.purpleText}>家族との食事時間を設定する</Text>
                      <Text style={styles.purpleSubtext}>
                        週に1回でも、ゆっくりと話せる時間を作ってみましょう
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  contentContainer: {
    flex: 1,
    marginTop: 80,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollView: {
    flex: 1,
  },
  innerContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  subsection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  grayText: {
    color: '#666',
  },
  bulletList: {
    paddingLeft: 16,
  },
  challengeList: {
    marginTop: 16,
  },
  pinkCard: {
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  pinkText: {
    fontWeight: '500',
    color: '#DC2626',
  },
  pinkSubtext: {
    fontSize: 14,
    color: '#DC2626',
    opacity: 0.8,
    marginTop: 4,
  },
  purpleCard: {
    padding: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 8,
  },
  purpleText: {
    fontWeight: '500',
    color: '#7C3AED',
  },
  purpleSubtext: {
    fontSize: 14,
    color: '#7C3AED',
    opacity: 0.8,
    marginTop: 4,
  },
});
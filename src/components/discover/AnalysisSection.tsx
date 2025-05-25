import { BarChart, LightbulbIcon, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AnalysisDetailView } from './AnalysisDetailView';

export function AnalysisSection() {
  const [showDetailView, setShowDetailView] = useState(false);

  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: 'rgba(252, 231, 243, 0.5)',
            padding: 24,
            borderRadius: 8,
            marginBottom: 32,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <BarChart size={20} color="#ec4899" />
            <Text style={{ fontSize: 18, fontWeight: '600' }}>あなたのクローズアップ</Text>
          </View>

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontWeight: '500', marginBottom: 8 }}>直近の目醒めのサマリー</Text>
              <Text style={{ color: '#4B5563' }}>
                最近、あなたは「家族との対話」に目が向き始めています。特に以下の点で成長が見られます：
              </Text>
              <View style={{ marginTop: 8, paddingLeft: 16, gap: 8 }}>
                <Text style={{ color: '#4B5563' }}>• 家族との対話時間が増加傾向</Text>
                <Text style={{ color: '#4B5563' }}>• 感情表現がより豊かに</Text>
                <Text style={{ color: '#4B5563' }}>• 相手の立場に立った考え方の増加</Text>
              </View>
            </View>

            <View>
              <Text style={{ fontWeight: '500', marginBottom: 8 }}>目醒めの提案</Text>
              <Text style={{ color: '#4B5563', marginBottom: 12 }}>
                こんなチャレンジはいかがでしょう？
              </Text>
              <View style={{ gap: 12 }}>
                <View style={{ padding: 16, backgroundColor: '#FCE7F3', borderRadius: 8 }}>
                  <Text style={{ fontWeight: '500', color: '#DB2777' }}>
                    苦手な親戚に手紙を書いてみる
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(219, 39, 119, 0.8)', marginTop: 4 }}>
                    直接の対話が難しい場合、手紙から始めるのもよい方法です
                  </Text>
                </View>
                <View style={{ padding: 16, backgroundColor: '#F3E8FF', borderRadius: 8 }}>
                  <Text style={{ fontWeight: '500', color: '#9333EA' }}>
                    家族との食事時間を設定する
                  </Text>
                  <Text style={{ fontSize: 14, color: 'rgba(147, 51, 234, 0.8)', marginTop: 4 }}>
                    週に1回でも、ゆっくりと話せる時間を作ってみましょう
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={{ backgroundColor: 'rgba(239, 246, 255, 0.5)', padding: 24, borderRadius: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Users size={20} color="#3b82f6" />
            <Text style={{ fontSize: 18, fontWeight: '600' }}>全体のクローズアップ</Text>
          </View>

          <View style={{ gap: 16 }}>
            <Text style={{ fontWeight: '500' }}>みんなの気づきのトレンド</Text>
            <Text style={{ color: '#4B5563' }}>多くの人が以下のような点に気づき始めています：</Text>

            <View style={{ gap: 12 }}>
              <View
                style={{
                  padding: 16,
                  backgroundColor: 'rgba(219, 234, 254, 0.5)',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '500', color: '#1E3A8A' }}>家族との関係</Text>
                <Text style={{ fontSize: 14, color: 'rgba(30, 58, 138, 0.8)', marginTop: 4 }}>
                  コミュニケーションの質を高めることに注目が集まっています
                </Text>
              </View>

              <View
                style={{
                  padding: 16,
                  backgroundColor: 'rgba(224, 231, 255, 0.5)',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '500', color: '#312E81' }}>
                  苦手なことへの向き合い方
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(49, 46, 129, 0.8)', marginTop: 4 }}>
                  小さなステップから始める方法が支持されています
                </Text>
              </View>

              <View
                style={{
                  padding: 16,
                  backgroundColor: 'rgba(237, 233, 254, 0.5)',
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontWeight: '500', color: '#4C1D95' }}>自己理解の深化</Text>
                <Text style={{ fontSize: 14, color: 'rgba(76, 29, 149, 0.8)', marginTop: 4 }}>
                  感情の変化を観察し、理解を深める取り組みが増えています
                </Text>
              </View>
            </View>
          </View>
        </View>

        <AnalysisDetailView open={showDetailView} onClose={() => setShowDetailView(false)} />
      </View>
    </ScrollView>
  );
}

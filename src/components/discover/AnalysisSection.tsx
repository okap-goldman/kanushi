import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart, LightbulbIcon, Users } from 'lucide-react-native';
import { AnalysisDetailView } from './AnalysisDetailView';

export function AnalysisSection() {
  const [showDetailView, setShowDetailView] = useState(false);

  return (
    <ScrollView className="flex-1">
      <View className="space-y-8 p-4">
        <View className="space-y-6 bg-pink-50/50 p-6 rounded-lg">
          <View className="flex-row items-center gap-2">
            <BarChart size={20} color="#ec4899" />
            <Text className="text-lg font-semibold">あなたのクローズアップ</Text>
          </View>

          <View className="space-y-4">
            <View>
              <Text className="font-medium mb-2">直近の目醒めのサマリー</Text>
              <Text className="text-gray-600">
                最近、あなたは「家族との対話」に目が向き始めています。特に以下の点で成長が見られます：
              </Text>
              <View className="mt-2 space-y-2 pl-4">
                <Text className="text-gray-600">• 家族との対話時間が増加傾向</Text>
                <Text className="text-gray-600">• 感情表現がより豊かに</Text>
                <Text className="text-gray-600">• 相手の立場に立った考え方の増加</Text>
              </View>
            </View>

            <View>
              <Text className="font-medium mb-2">目醒めの提案</Text>
              <Text className="text-gray-600 mb-3">こんなチャレンジはいかがでしょう？</Text>
              <View className="space-y-3">
                <View className="p-4 bg-pink-50 rounded-lg">
                  <Text className="font-medium text-pink-600">苦手な親戚に手紙を書いてみる</Text>
                  <Text className="text-sm text-pink-600/80 mt-1">
                    直接の対話が難しい場合、手紙から始めるのもよい方法です
                  </Text>
                </View>
                <View className="p-4 bg-purple-50 rounded-lg">
                  <Text className="font-medium text-purple-600">家族との食事時間を設定する</Text>
                  <Text className="text-sm text-purple-600/80 mt-1">
                    週に1回でも、ゆっくりと話せる時間を作ってみましょう
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View className="space-y-6 bg-blue-50/50 p-6 rounded-lg">
          <View className="flex-row items-center gap-2">
            <Users size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold">全体のクローズアップ</Text>
          </View>

          <View className="space-y-4">
            <Text className="font-medium">みんなの気づきのトレンド</Text>
            <Text className="text-gray-600">
              多くの人が以下のような点に気づき始めています：
            </Text>
            
            <View className="space-y-3">
              <View className="p-4 bg-blue-100/50 rounded-lg">
                <Text className="font-medium text-blue-900">家族との関係</Text>
                <Text className="text-sm text-blue-900/80 mt-1">
                  コミュニケーションの質を高めることに注目が集まっています
                </Text>
              </View>
              
              <View className="p-4 bg-indigo-100/50 rounded-lg">
                <Text className="font-medium text-indigo-900">苦手なことへの向き合い方</Text>
                <Text className="text-sm text-indigo-900/80 mt-1">
                  小さなステップから始める方法が支持されています
                </Text>
              </View>
              
              <View className="p-4 bg-violet-100/50 rounded-lg">
                <Text className="font-medium text-violet-900">自己理解の深化</Text>
                <Text className="text-sm text-violet-900/80 mt-1">
                  感情の変化を観察し、理解を深める取り組みが増えています
                </Text>
              </View>
            </View>
          </View>
        </View>

        <AnalysisDetailView 
          open={showDetailView} 
          onClose={() => setShowDetailView(false)} 
        />
      </View>
    </ScrollView>
  );
}
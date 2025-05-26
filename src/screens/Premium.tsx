import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';

const { width } = Dimensions.get('window');

export default function Premium() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const premiumFeatures = [
    {
      icon: 'image',
      title: 'オリジナルステッカー作成',
      description: '画像から独自のステッカーを作成できます',
    },
    {
      icon: 'headphones',
      title: '高音質再生',
      description: '音声コンテンツを最高品質でお楽しみいただけます',
    },
    {
      icon: 'download',
      title: 'オフライン再生',
      description: 'お気に入りの音声をダウンロードして再生できます',
    },
    {
      icon: 'users',
      title: 'プレミアム限定コンテンツ',
      description: '特別なコンテンツにアクセスできます',
    },
    {
      icon: 'zap',
      title: '優先サポート',
      description: 'お困りのときは優先的にサポートをお受けいただけます',
    },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      Alert.alert(
        'ログインが必要です',
        'プレミアムプランにお申し込みいただくには、ログインが必要です。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'ログイン', onPress: () => navigation.navigate('Login' as never) },
        ]
      );
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement Stripe subscription
      toast({
        title: 'プレミアムプランへのお申し込み',
        description: '現在準備中です。もうしばらくお待ちください。',
      });
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'お申し込みの処理中にエラーが発生しました。',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Premium</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Feather name="award" size={64} color="#7C3AED" style={styles.heroIcon} />
          <Text style={styles.heroTitle}>
            目醒めをより深く。{'\n'}
            Premium Standardを{'\n'}
            1ヶ月無料でお試しください。
          </Text>
          <Text style={styles.heroSubtitle}>
            アプリから直接プレミアムプランにお申し込みいただけます。{'\n'}
            最初の1ヶ月は無料でお使いいただけます。
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Premiumにご登録いただくと</Text>
          
          {premiumFeatures.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Feather name={feature.icon as any} size={24} color="#fff" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.priceCard}>
            <Text style={styles.planName}>Premium Standard</Text>
            <View style={styles.priceRow}>
              <Text style={styles.price}>¥980</Text>
              <Text style={styles.pricePeriod}>/月</Text>
            </View>
            <Text style={styles.trialText}>最初の1ヶ月は無料</Text>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <Button
            onPress={handleSubscribe}
            style={styles.subscribeButton}
            disabled={isLoading}
          >
            {isLoading ? '処理中...' : '今すぐ無料でお試し'}
          </Button>
          <Text style={styles.disclaimer}>
            いつでもキャンセルできます。{'\n'}
            無料期間終了の3日前にお知らせいたします。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  heroIcon: {
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
    color: '#1A202C',
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 24,
    color: '#1A202C',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1A202C',
  },
  featureDescription: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  pricingSection: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  priceCard: {
    backgroundColor: '#F7FAFC',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#7C3AED',
    alignItems: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#7C3AED',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1A202C',
  },
  pricePeriod: {
    fontSize: 18,
    color: '#718096',
    marginLeft: 4,
  },
  trialText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
  },
  ctaSection: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  subscribeButton: {
    width: width - 48,
    height: 56,
    backgroundColor: '#7C3AED',
    marginBottom: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 18,
  },
});
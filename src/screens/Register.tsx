import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation<any>();
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !username) {
      setError('すべての項目を入力してください');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { error, user } = await signUp(email, password, username);

      if (error) {
        setError(error.message);
      } else if (user) {
        // Registration successful - the auth listener will redirect to the main app
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Image
              source={require('../../assets/icon.png')}
              style={styles.logo}
              contentFit="contain"
            />
            <Text style={styles.title}>アカウント作成</Text>
            <Text style={styles.subtitle}>Kanushiに参加しよう</Text>
          </View>

          <View style={styles.form}>
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Input
              label="ユーザー名"
              placeholder="ユーザー名を入力"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />

            <Input
              label="メールアドレス"
              placeholder="メールアドレスを入力"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label="パスワード"
              placeholder="パスワードを設定"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Button onPress={handleRegister} disabled={loading} loading={loading} fullWidth>
              登録
            </Button>

            <View style={styles.footer}>
              <Text style={styles.footerText}>すでにアカウントをお持ちの方は</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.footerLink}>ログイン</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#4A5568',
  },
  form: {
    width: '100%',
  },
  errorText: {
    color: '#E53E3E',
    marginBottom: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#4A5568',
    marginRight: 4,
  },
  footerLink: {
    color: '#0070F3',
    fontWeight: '600',
  },
});

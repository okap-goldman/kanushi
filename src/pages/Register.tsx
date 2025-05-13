import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('チェック中...');
  const [networkStatus, setNetworkStatus] = useState<string>('未確認');
  const navigate = useNavigate();
  
  // Check Supabase connection on component mount
  useEffect(() => {
    async function checkSupabaseConnection() {
      try {
        console.log('Register - Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
        console.log('Register - Supabase Key Defined:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
        
        // First, check if we can reach the Supabase URL
        try {
          console.log('Testing network connectivity to Supabase URL...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(import.meta.env.VITE_SUPABASE_URL, {
            method: 'HEAD',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          console.log('Network connectivity test:', response.status);
          setNetworkStatus(`接続OK (${response.status})`);
        } catch (netErr) {
          console.error('Network connectivity test failed:', netErr);
          setNetworkStatus(`接続失敗: ${netErr instanceof Error ? netErr.message : String(netErr)}`);
        }
        
        // Then try a Supabase query
        console.log('Testing Supabase API connection...');
        const { data, error } = await supabase.from('_dummy_query').select('*').limit(1);
        
        if (error) {
          console.error('Supabase API test failed:', error);
          setConnectionStatus(`API接続エラー: ${error.message}`);
        } else {
          console.log('Supabase API test success:', data);
          setConnectionStatus('API接続成功');
        }
      } catch (err) {
        console.error('Supabase connection check exception:', err);
        setConnectionStatus(`接続例外: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    
    checkSupabaseConnection();
  }, []);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      console.log('Starting email registration process...');
      
      // Check for network connectivity first
      try {
        console.log('Checking network connectivity before registration...');
        // Attempt to connect with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Network connectivity check successful:', response.status);
      } catch (networkErr) {
        console.error('Network connectivity check failed:', networkErr);
        throw new Error('ネットワーク接続エラー: Supabaseサーバーに接続できません。ネットワーク接続を確認してください。');
      }
      
      // Sign up the user
      console.log('Calling supabase.auth.signUp...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      console.log('Sign up response:', authError ? 'Error' : 'Success', authError || (authData?.user ? 'User created' : 'No user returned'));
      
      if (authError) throw authError;
      
      if (authData?.user) {
        // Create the user profile
        console.log('Creating user profile for:', authData.user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: authData.user.id,
              name: name,
              username: username,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`
            }
          ]);

        console.log('Profile creation response:', profileError ? 'Error' : 'Success', profileError || 'Profile created');
        
        if (profileError) throw profileError;
        console.log('Registration complete, navigating to home');
        navigate('/');
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'アカウントの作成中にエラーが発生しました。後でもう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignUp = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Starting OAuth signup with ${provider}...`);
      
      // Check for network connectivity first
      try {
        console.log('Checking network connectivity before OAuth...');
        // Attempt to connect with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL, {
          method: 'HEAD',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('Network connectivity check for OAuth successful:', response.status);
      } catch (networkErr) {
        console.error('Network connectivity check for OAuth failed:', networkErr);
        throw new Error('ネットワーク接続エラー: Supabaseサーバーに接続できません。ネットワーク接続を確認してください。');
      }
      
      console.log(`Calling supabase.auth.signInWithOAuth for ${provider}...`);
      console.log('RedirectTo URL:', `${window.location.origin}/profile/edit`);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/profile/edit`,
        },
      });

      console.log(`OAuth ${provider} response:`, error ? 'Error' : 'Success', error || 'Redirect initiated');
      
      if (error) throw error;
    } catch (error: any) {
      console.error('OAuth sign-up error:', error);
      setError(error.message || `${provider}でのログインに失敗しました。後でもう一度お試しください。`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">新規登録</CardTitle>
          <CardDescription>
            アカウントを登録して始めましょう
          </CardDescription>
          <div className="mt-2 text-xs">
            <div className={`p-1 text-center rounded ${
              networkStatus.includes('失敗') 
                ? 'bg-red-50 text-red-500' 
                : networkStatus.includes('OK') 
                  ? 'bg-green-50 text-green-500'
                  : 'bg-blue-50 text-blue-500'
            }`}>
              ネットワーク: {networkStatus}
            </div>
            <div className={`mt-1 p-1 text-center rounded ${
              connectionStatus.includes('エラー') || connectionStatus.includes('例外') 
                ? 'bg-red-50 text-red-500' 
                : connectionStatus.includes('成功') 
                  ? 'bg-green-50 text-green-500'
                  : 'bg-blue-50 text-blue-500'
            }`}>
              Supabase API: {connectionStatus}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full"
              disabled={loading}
              onClick={() => handleOAuthSignUp('google')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google で登録
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              disabled={loading}
              onClick={() => handleOAuthSignUp('apple')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2">
                <path d="M14.94,5.19A4.38,4.38,0,0,0,16,2,4.44,4.44,0,0,0,13,3.52,4.17,4.17,0,0,0,12,6.61,3.69,3.69,0,0,0,14.94,5.19Zm2.52,7.44a4.51,4.51,0,0,1,2.16-3.81,4.66,4.66,0,0,0-3.66-2c-1.56-.16-3,.91-3.83.91s-2-.89-3.3-.87A4.92,4.92,0,0,0,4.69,9.39C2.93,12.45,4.24,17,6,19.47,6.8,20.68,7.8,22.05,9.12,22s1.75-.82,3.28-.82,2,.82,3.3.79,2.22-1.24,3.06-2.45a11,11,0,0,0,1.38-2.85A4.41,4.41,0,0,1,17.46,12.63Z" />
              </svg>
              Apple で登録
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                または
              </span>
            </div>
          </div>
          <form onSubmit={handleEmailSignUp}>
            {error && (
              <div className="p-4 mb-4 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                <div className="flex items-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">エラーが発生しました</span>
                </div>
                <p>{error}</p>
                {error.includes('ネットワーク接続エラー') && (
                  <ul className="mt-2 list-disc list-inside text-xs">
                    <li>インターネット接続が有効かどうか確認してください</li>
                    <li>ブラウザを再読み込みしてみてください</li>
                    <li>しばらく待ってから再度お試しください</li>
                  </ul>
                )}
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">お名前</Label>
                <Input
                  id="name"
                  placeholder="名前を入力"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">ユーザーネーム</Label>
                <Input
                  id="username"
                  placeholder="英数字のみ"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">パスワード</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登録中...' : '登録する'}
              </Button>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-sm text-center text-muted-foreground mt-2">
            すでにアカウントをお持ちですか？{' '}
            <Link to="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
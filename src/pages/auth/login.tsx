import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FcGoogle } from 'react-icons/fc';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const isDevelopment = import.meta.env.MODE === 'development';
  const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;
  
  // 開発環境では自動的に利用規約に同意
  const [agreedToTerms, setAgreedToTerms] = useState(isDevelopment);
  
  const { user, isInitialized, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleGoogleLogin = useCallback(async () => {
    if (!agreedToTerms) {
      toast({
        title: 'エラー',
        description: '利用規約とプライバシーポリシーに同意してください',
        variant: 'destructive',
      });
      return;
    }

    try {
      await login();
      toast({
        title: 'ログイン成功',
        description: 'ようこそ！',
      });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'エラー',
        description: 'ログインに失敗しました',
        variant: 'destructive',
      });
    }
  }, [agreedToTerms, login, toast]);

  useEffect(() => {
    if (isInitialized && user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
    
    // 開発環境では自動的にログイン
    if (isDevelopment && testingEmail && isInitialized && !user) {
      handleGoogleLogin();
    }
  }, [user, isInitialized, navigate, location, isDevelopment, testingEmail, handleGoogleLogin]);

  if (!isInitialized) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
    </div>;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">目醒め人のためのSNS</h1>
        </div>

        <div className="space-y-6">
          {isDevelopment && testingEmail && (
            <div className="text-sm text-gray-500 text-center">
              開発環境: {testingEmail} でログイン
            </div>
          )}
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full flex items-center justify-center gap-2 py-6"
            disabled={!agreedToTerms}
          >
            <FcGoogle className="w-6 h-6" />
            <span>Googleでログイン</span>
          </Button>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <a href="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">利用規約</a>
                と
                <a href="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>
                に同意する
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}                                
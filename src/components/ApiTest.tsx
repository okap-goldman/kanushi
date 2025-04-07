/**
 * API接続テストモジュール
 * 
 * バックエンドAPIとの接続状態をテストするためのコンポーネントを提供します。
 * APIエンドポイントからのレスポンスを表示し、接続状態を確認できます。
 */
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * APIテストコンポーネント
 * 
 * バックエンドAPIとの接続状態をテストし、結果を表示するコンポーネントです。
 * 自動的にAPIエンドポイントにリクエストを送信し、レスポンスを表示します。
 * また、手動で再テストを行うボタンも提供します。
 * 
 * @returns {JSX.Element} APIテストコンポーネント
 */
export function ApiTest() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * APIデータをフェッチする関数
   * 
   * '/api/hello'エンドポイントにリクエストを送信し、
   * レスポンスを状態として保存します。
   * エラーが発生した場合はエラーメッセージを表示します。
   */
  const fetchApiData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/hello');
      if (!response.ok) {
        throw new Error(`APIリクエストエラー: ${response.status}`);
      }
      
      const data = await response.json();
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知のエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  /**
   * コンポーネントマウント時にAPIをテスト
   */
  useEffect(() => {
    fetchApiData();
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>バックエンドAPI接続テスト</CardTitle>
        <CardDescription>フロントエンドとバックエンドの連携をテストします</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>データを読み込み中...</p>}
        {error && <p className="text-red-500">{error}</p>}
        {message && <p className="text-green-500">{message}</p>}
      </CardContent>
      <CardFooter>
        <Button onClick={fetchApiData} disabled={loading}>
          APIを再テスト
        </Button>
      </CardFooter>
    </Card>
  );
} 
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiTest() {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    // コンポーネントマウント時に自動的にAPIをテスト
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
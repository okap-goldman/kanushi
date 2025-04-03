import express, { Request, Response } from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { supabase } from '../src/lib/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 4488);

async function startServer() {
  const app = express();
  
  // ボディパーサーミドルウェアの追加
  app.use(express.json());
  
  // APIルートの設定
  app.get('/api/hello', (req, res) => {
    res.json({ message: 'バックエンドAPIが正常に動作しています' });
  });
  
  // 動画アップロードステータスの取得
  app.get('/api/uploads/:uploadId', async (req: express.Request, res: express.Response) => {
    try {
      const { uploadId } = req.params;
      
      if (!uploadId) {
        return res.status(400).json({ message: 'Upload ID is required' });
      }
      
      const { data, error } = await supabase
        .from('VIDEO_UPLOADS')
        .select('*')
        .eq('id', uploadId)
        .single();
        
      if (error) {
        console.error('アップロードステータス取得エラー:', error);
        return res.status(500).json({ message: 'Failed to get upload status' });
      }
      
      if (!data) {
        return res.status(404).json({ message: 'Upload not found' });
      }
      
      return res.json(data);
    } catch (err) {
      console.error('アップロードステータス取得エラー:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });

  let vite: ViteDevServer;

  if (isProduction) {
    // 本番環境: ビルド済みのフロントエンドを配信
    const distPath = resolve(__dirname, '../dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      res.sendFile(resolve(distPath, 'index.html'));
    });

    // 本番環境では直接Expressサーバーで起動
    app.listen(port, () => {
      console.log(`本番サーバーが起動しました: http://localhost:${port}`);
    });
  } else {
    // 開発環境: Viteの開発サーバーを直接起動
    try {
      vite = await createViteServer({
        root: resolve(__dirname, '..'),
        server: {
          port: port,
          host: '0.0.0.0',
          proxy: {
            '/api': {
              target: `http://localhost:${port}`,
              changeOrigin: true,
              configure: (proxy, _options) => {
                proxy.on('error', (err, _req, _res) => {
                  console.log('プロキシエラー', err);
                });
              },
            }
          },
        },
        appType: 'spa',
      });

      // APIエンドポイントを処理するミドルウェアを追加
      vite.middlewares.use('/api/hello', (req: IncomingMessage, res: ServerResponse) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ message: 'バックエンドAPIが正常に動作しています' }));
      });

      // ViteサーバーはAPI以外のリクエストを処理
      await vite.listen();
      console.log(`開発サーバーが起動しました: http://localhost:${port}`);
    } catch (e) {
      console.error('Viteサーバー起動エラー:', e);
      process.exit(1);
    }
  }
}

startServer().catch((err) => {
  console.error('サーバー起動エラー:', err);
}); 
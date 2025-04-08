/**
 * サーバーサイドアプリケーションエントリポイント
 * 
 * 開発・本番環境でのサーバー起動とAPI提供を担当
 */
import express, { Request, Response, RequestHandler } from 'express';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { supabase } from '../src/lib/supabase';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 4488);

// データベースのレコード型を定義
interface UploadRecord {
  id: number;
  user_id: number;
  filename: string;
  filesize: number;
  status: string;
  youtube_url?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * APIルートを設定する
 * @param {express.Application} app - Expressアプリケーションインスタンス
 * @returns {void}
 */
const setupApiRoutes = (app: express.Application): void => {
  app.get('/api/hello', ((_req: Request, res: Response) => {
    res.json({ message: 'バックエンドAPIが正常に動作しています' });
  }) as RequestHandler);

  app.get('/api/uploads/:uploadId', ((req: Request, res: Response) => {
    const handleUploadRequest = async () => {
      try {
        const { uploadId } = req.params;
        
        if (!uploadId) {
          return res.status(400).json({ message: 'Upload ID is required' });
        }
        
        const result = await getUploadStatus(uploadId);
        
        if (result.error) {
          return res.status(500).json({ message: 'Failed to get upload status' });
        }
        
        if (!result.data) {
          return res.status(404).json({ message: 'Upload not found' });
        }
        
        return res.json(result.data);
      } catch (err) {
        console.error('アップロードステータス取得エラー:', err);
        return res.status(500).json({ message: 'Internal server error' });
      }
    };
    
    handleUploadRequest();
  }) as RequestHandler);
};

/**
 * アップロードステータスをデータベースから取得
 * @param {string} uploadId - アップロードID
 * @returns {Promise<{data: UploadRecord | null, error: Error | null}>} 取得結果
 */
const getUploadStatus = async (uploadId: string): Promise<{data: UploadRecord | null, error: Error | null}> => {
  try {
    const { data, error } = await supabase
      .from('VIDEO_UPLOADS')
      .select('*')
      .eq('id', uploadId)
      .single();
      
    if (error) {
      console.error('アップロードステータス取得エラー:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('アップロードステータス取得エラー:', err);
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};

/**
 * 本番環境用サーバーをセットアップ
 * @param {express.Application} app - Expressアプリケーションインスタンス
 * @returns {void}
 */
const setupProductionServer = (app: express.Application): void => {
  const distPath = resolve(__dirname, '../dist');
  app.use(express.static(distPath));
  
  app.get('*', ((_req: Request, res: Response) => {
    res.sendFile(resolve(distPath, 'index.html'));
  }) as RequestHandler);

  app.listen(port, () => {
    console.log(`本番サーバーが起動しました: http://localhost:${port}`);
  });
};

/**
 * 開発環境用Viteサーバーをセットアップ
 * @returns {Promise<ViteDevServer>} Viteサーバーインスタンス
 */
const setupDevelopmentServer = async (): Promise<ViteDevServer> => {
  try {
    const vite = await createViteServer({
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

    vite.middlewares.use('/api/hello', (_req: IncomingMessage, res: ServerResponse) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'バックエンドAPIが正常に動作しています' }));
    });

    await vite.listen();
    console.log(`開発サーバーが起動しました: http://localhost:${port}`);
    
    return vite;
  } catch (e) {
    console.error('Viteサーバー起動エラー:', e);
    throw e;
  }
};

/**
 * サーバーを起動する
 * @returns {Promise<void>}
 */
const startServer = async (): Promise<void> => {
  const app = express();
  
  app.use(express.json());
  
  setupApiRoutes(app);

  if (isProduction) {
    setupProductionServer(app);
  } else {
    await setupDevelopmentServer();
  }
};

startServer().catch((err) => {
  console.error('サーバー起動エラー:', err);
  process.exit(1);
}); 
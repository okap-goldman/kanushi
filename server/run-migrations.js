// マイグレーションスクリプトを実行するヘルパー
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabaseクライアントの作成
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase環境変数が設定されていません。');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigrations() {
  try {
    // マイグレーションディレクトリのファイルを取得
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // ファイル名でソートして順番に実行
    
    console.log(`実行するマイグレーションファイル: ${migrationFiles.length}件`);
    
    // 各マイグレーションスクリプトを実行
    for (const file of migrationFiles) {
      console.log(`実行中: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // SQLスクリプトを実行
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.error(`マイグレーションエラー (${file}):`, error);
        process.exit(1);
      }
      
      console.log(`完了: ${file}`);
    }
    
    console.log('すべてのマイグレーションが完了しました！');
  } catch (error) {
    console.error('マイグレーション実行中にエラーが発生しました:', error);
    process.exit(1);
  }
}

runMigrations(); 
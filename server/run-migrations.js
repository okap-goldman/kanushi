/**
 * マイグレーションスクリプト実行ユーティリティ
 * 
 * Supabaseデータベースにマイグレーションスクリプトを適用する
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 環境変数からSupabase接続情報を取得
 * @returns {{url: string, key: string}} Supabase接続情報
 */
const getSupabaseCredentials = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase環境変数が設定されていません。');
    process.exit(1);
  }

  return { url: supabaseUrl, key: supabaseKey };
};

/**
 * マイグレーションファイルを取得して並べ替える
 * @returns {string[]} ソート済みのマイグレーションファイル名配列
 */
const getMigrationFiles = () => {
  const migrationsDir = path.join(__dirname, 'migrations');
  
  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // ファイル名でソートして順番に実行
};

/**
 * 単一のマイグレーションスクリプトを実行
 * @param {object} supabase - Supabaseクライアント
 * @param {string} filePath - マイグレーションファイルのパス
 * @param {string} fileName - マイグレーションファイル名（ログ用）
 * @returns {Promise<void>}
 */
const executeMigration = async (supabase, filePath, fileName) => {
  console.log(`実行中: ${fileName}`);
  
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // SQLスクリプトを実行
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error(`マイグレーションエラー (${fileName}):`, error);
    throw error;
  }
  
  console.log(`完了: ${fileName}`);
};

/**
 * マイグレーションを実行する
 * @returns {Promise<void>}
 */
const runMigrations = async () => {
  try {
    const { url, key } = getSupabaseCredentials();
    const supabase = createClient(url, key);
    
    // マイグレーションディレクトリのファイルを取得
    const migrationFiles = getMigrationFiles();
    const migrationsDir = path.join(__dirname, 'migrations');
    
    console.log(`実行するマイグレーションファイル: ${migrationFiles.length}件`);
    
    // 各マイグレーションスクリプトを実行
    for (const file of migrationFiles) {
      await executeMigration(
        supabase, 
        path.join(migrationsDir, file),
        file
      );
    }
    
    console.log('すべてのマイグレーションが完了しました！');
  } catch (error) {
    console.error('マイグレーション実行中にエラーが発生しました:', error);
    process.exit(1);
  }
};

runMigrations(); 
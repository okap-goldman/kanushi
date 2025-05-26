#!/usr/bin/env tsx

/**
 * データベース完全リセット & セットアップ統合スクリプト
 * 
 * 実行内容:
 * 1. データベース完全リセット
 * 2. Drizzle マイグレーション生成
 * 3. Drizzle マイグレーション適用
 * 4. モックデータシーディング
 * 
 * 使用方法:
 * npx tsx scripts/reset-and-setup.ts --confirm
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { resetDatabase } from './reset-database';
import { seedDatabase } from './seed-with-drizzle';
import { config } from 'dotenv';

const execAsync = promisify(exec);

// 環境変数を読み込み
config({ path: '.env.local' });

/**
 * コマンド実行ヘルパー
 */
const runCommand = async (command: string, description: string) => {
  console.log(`🔧 ${description}...`);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✅ ${description} 完了\n`);
  } catch (error) {
    console.error(`❌ ${description} 失敗:`, error);
    throw error;
  }
};

/**
 * 必要な依存関係をチェック
 */
const checkDependencies = async () => {
  console.log('🔍 依存関係をチェック中...');
  
  try {
    // postgres パッケージの確認
    await execAsync('npm list postgres');
    console.log('✅ postgres パッケージが利用可能');
  } catch (error) {
    console.log('📦 postgres パッケージをインストール中...');
    await runCommand('npm install postgres', 'postgres パッケージインストール');
  }
  
  try {
    // tsx の確認
    await execAsync('npx tsx --version');
    console.log('✅ tsx が利用可能');
  } catch (error) {
    console.log('📦 tsx をインストール中...');
    await runCommand('npm install -D tsx', 'tsx インストール');
  }
  
  console.log('');
};

/**
 * 環境変数の確認
 */
const checkEnvironment = () => {
  console.log('🔧 環境変数をチェック中...');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ 以下の環境変数が設定されていません:');
    missingVars.forEach(varName => console.error(`  - ${varName}`));
    console.error('\n.env.local ファイルを確認してください。');
    process.exit(1);
  }
  
  console.log('✅ 必要な環境変数がすべて設定されています\n');
};

/**
 * データベース接続テスト
 */
const testDatabaseConnection = async () => {
  console.log('🔌 データベース接続をテスト中...');
  
  try {
    const { createMigrationClient } = await import('../src/lib/db/drizzle-client');
    const client = createMigrationClient();
    
    await client`SELECT 1 as test`;
    await client.end();
    
    console.log('✅ データベース接続成功\n');
  } catch (error) {
    console.error('❌ データベース接続失敗:', error);
    console.error('\nDATABASE_URL を確認してください。');
    process.exit(1);
  }
};

/**
 * メイン実行関数
 */
const resetAndSetup = async () => {
  console.log('🚀 データベース完全リセット & セットアップを開始');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // 1. 事前チェック
    await checkDependencies();
    checkEnvironment();
    await testDatabaseConnection();
    
    // 2. データベースリセット
    console.log('📋 ステップ 1: データベース完全リセット');
    console.log('-'.repeat(40));
    await resetDatabase();
    console.log('');
    
    // 3. Drizzle マイグレーション生成
    console.log('📋 ステップ 2: Drizzle マイグレーション生成');
    console.log('-'.repeat(40));
    await runCommand('npm run db:generate', 'マイグレーション生成');
    
    // 4. Drizzle マイグレーション適用
    console.log('📋 ステップ 3: Drizzle マイグレーション適用'); 
    console.log('-'.repeat(40));
    await runCommand('npm run db:migrate', 'マイグレーション適用');
    
    // 5. モックデータシーディング
    console.log('📋 ステップ 4: モックデータシーディング');
    console.log('-'.repeat(40));
    await seedDatabase();
    
    // 6. 完了報告
    console.log('');
    console.log('🎉 すべてのセットアップが完了しました！');
    console.log('='.repeat(60));
    console.log('');
    console.log('次に実行できること:');
    console.log('- npm run db:studio でデータベースを確認');
    console.log('- npm run web でアプリケーションを起動');
    console.log('- npm test でテストを実行');
    console.log('');
    
    // プロセスを正常終了
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ セットアップ中にエラーが発生しました:', error);
    console.error('');
    console.error('トラブルシューティング:');
    console.error('1. .env.local ファイルの環境変数を確認');
    console.error('2. データベース接続情報を確認');
    console.error('3. Supabase プロジェクトが正常に動作していることを確認');
    process.exit(1);
  }
};

// メイン実行
if (require.main === module) {
  // 安全確認
  const confirmation = process.argv.includes('--confirm');
  if (!confirmation) {
    console.log('🚨 警告: このスクリプトはデータベースを完全に削除して再構築します！');
    console.log('');
    console.log('以下の処理が実行されます:');
    console.log('1. 既存のすべてのテーブル・データを削除');
    console.log('2. Drizzle スキーマから新しいマイグレーションを生成');
    console.log('3. データベースにスキーマを適用');
    console.log('4. 日本語モックデータを投入');
    console.log('');
    console.log('実行するには --confirm フラグを付けてください:');
    console.log('npx tsx scripts/reset-and-setup.ts --confirm');
    console.log('');
    console.log('または、個別に実行したい場合:');
    console.log('1. npx tsx scripts/reset-database.ts --confirm');
    console.log('2. npm run db:generate');
    console.log('3. npm run db:migrate');
    console.log('4. npx tsx scripts/seed-with-drizzle.ts');
    process.exit(1);
  }
  
  resetAndSetup();
}

export { resetAndSetup };
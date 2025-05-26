#!/usr/bin/env node

/**
 * 日本語のスピリチュアル系モックデータをSupabaseに適用するスクリプト
 * 
 * 使用方法:
 * 1. 環境変数 DATABASE_URL を設定
 * 2. npm run db:seed を実行
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATION_FILE = '013_seed_japanese_mock_data.sql';
const MIGRATION_PATH = path.join(__dirname, '..', 'supabase', 'migrations', MIGRATION_FILE);

// 環境変数のチェック
if (!process.env.DATABASE_URL) {
  console.error('❌ エラー: DATABASE_URL 環境変数が設定されていません。');
  console.error('Supabaseプロジェクトの設定からデータベースURLを取得し、環境変数に設定してください。');
  console.error('例: export DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"');
  process.exit(1);
}

// マイグレーションファイルの存在確認
if (!fs.existsSync(MIGRATION_PATH)) {
  console.error(`❌ エラー: マイグレーションファイルが見つかりません: ${MIGRATION_PATH}`);
  process.exit(1);
}

console.log('🌟 日本語モックデータの適用を開始します...');
console.log(`📁 マイグレーションファイル: ${MIGRATION_FILE}`);

try {
  // psqlコマンドを使用してSQLを実行
  // 注: psqlがインストールされている必要があります
  const command = `psql "${process.env.DATABASE_URL}" -f "${MIGRATION_PATH}"`;
  
  console.log('⏳ データベースにモックデータを挿入中...');
  execSync(command, { stdio: 'inherit' });
  
  console.log('✅ モックデータの適用が完了しました！');
  console.log('\n📊 挿入されたデータ:');
  console.log('  - 8人のスピリチュアル系プロフィール');
  console.log('  - 10件の投稿（音声・テキスト）');
  console.log('  - 15個のハッシュタグ');
  console.log('  - 4件のイベント');
  console.log('  - コメント、いいね、フォロー関係');
  console.log('  - 2件のストーリーズ');
  
  console.log('\n🎉 Kanushiアプリで日本語のモックデータを確認できます！');
  
} catch (error) {
  console.error('❌ エラーが発生しました:', error.message);
  console.error('\n💡 ヒント:');
  console.error('1. psqlコマンドがインストールされているか確認してください');
  console.error('2. DATABASE_URLが正しいか確認してください');
  console.error('3. データベースへの接続権限があるか確認してください');
  console.error('4. 既にデータが存在する場合は、重複エラーになる可能性があります');
  process.exit(1);
}
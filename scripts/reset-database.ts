#!/usr/bin/env tsx

/**
 * データベース完全リセットスクリプト
 * 
 * 実行内容:
 * 1. すべてのユーザーテーブルを削除
 * 2. すべてのカスタム型（ENUM）を削除  
 * 3. Drizzleマイグレーション履歴をクリア
 * 4. 必要な拡張機能のみ残す
 * 
 * 注意: このスクリプトは破壊的です！本番環境では絶対に実行しないでください。
 */

import { createMigrationClient } from '../src/lib/db/drizzle-client';
import { config } from 'dotenv';

// 環境変数を読み込み
config({ path: '.env.local' });

const resetDatabase = async () => {
  console.log('🚨 データベース完全リセットを開始します...');
  
  const client = createMigrationClient();
  
  try {
    // 1. すべてのテーブルを削除（cascade で関連も削除）
    console.log('📋 既存テーブルを削除中...');
    
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
    `;
    
    if (tables && tables.length > 0) {
      for (const table of tables) {
        await client`DROP TABLE IF EXISTS ${client(table.tablename)} CASCADE`;
        console.log(`  ✅ テーブル削除: ${table.tablename}`);
      }
    } else {
      console.log('  ℹ️ 削除するテーブルがありません');
    }
    
    // 2. すべてのENUM型を削除
    console.log('🔢 カスタム型（ENUM）を削除中...');
    
    const enums = await client`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `;
    
    if (enums && enums.length > 0) {
      for (const enumType of enums) {
        await client`DROP TYPE IF EXISTS ${client(enumType.typname)} CASCADE`;
        console.log(`  ✅ ENUM削除: ${enumType.typname}`);
      }
    } else {
      console.log('  ℹ️ 削除するENUM型がありません');
    }
    
    // 3. すべてのシーケンスを削除
    console.log('🔢 シーケンスを削除中...');
    
    const sequences = await client`
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public'
    `;
    
    if (sequences && sequences.length > 0) {
      for (const sequence of sequences) {
        await client`DROP SEQUENCE IF EXISTS ${client(sequence.sequencename)} CASCADE`;
        console.log(`  ✅ シーケンス削除: ${sequence.sequencename}`);
      }
    } else {
      console.log('  ℹ️ 削除するシーケンスがありません');
    }
    
    // 4. Drizzleマイグレーション履歴テーブルを削除
    console.log('📊 Drizzleマイグレーション履歴を削除中...');
    await client`DROP TABLE IF EXISTS __drizzle_migrations CASCADE`;
    
    // 5. 必要な拡張機能を確保
    console.log('🔧 必要な拡張機能を確保中...');
    await client`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
    await client`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`;
    
    console.log('✅ データベースリセット完了！');
    console.log('');
    console.log('次のステップ:');
    console.log('1. npm run db:generate でマイグレーション生成');
    console.log('2. npm run db:migrate でスキーマ適用');
    console.log('3. npm run db:seed でモックデータ投入');
    
  } catch (error) {
    console.error('❌ データベースリセット中にエラーが発生:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

// メイン実行
if (require.main === module) {
  // 安全確認
  const confirmation = process.argv.includes('--confirm');
  if (!confirmation) {
    console.log('🚨 警告: このスクリプトはデータベースを完全に削除します！');
    console.log('');
    console.log('実行するには --confirm フラグを付けてください:');
    console.log('npx tsx scripts/reset-database.ts --confirm');
    process.exit(1);
  }
  
  resetDatabase();
}

export { resetDatabase };
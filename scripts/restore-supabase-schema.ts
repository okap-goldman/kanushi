#!/usr/bin/env tsx

/**
 * Supabase既存マイグレーションを使用してスキーマを復元
 */

import { createMigrationClient } from '../src/lib/db/drizzle-client';
import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

// 環境変数を読み込み
config({ path: '.env.local' });

const restoreSchema = async () => {
  console.log('🔧 Supabase既存マイグレーションでスキーマを復元中...');
  
  const client = createMigrationClient();
  
  try {
    // 主要なマイグレーションファイルを順番に実行
    const migrations = [
      '001_create_profile_and_account_tables.sql',
      '002_create_post_and_story_tables.sql',
      '003_create_messaging_tables.sql',
      '004_create_live_room_and_gift_tables.sql',
      '005_create_event_tables.sql',
      '006_create_ecommerce_tables.sql',
      '007_create_group_tables.sql',
      '008_create_ai_and_search_tables.sql',
      '009_create_notification_and_schedule_tables.sql',
      '010_alter_event_types_and_add_workshop_tables.sql',
      '011_add_story_interaction_tables.sql',
      '012_add_encryption_keys_to_profiles.sql'
    ];
    
    for (const migration of migrations) {
      console.log(`📄 実行中: ${migration}`);
      
      const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migration);
      const sql = readFileSync(migrationPath, 'utf-8');
      
      // SQLを実行
      await client.unsafe(sql);
      console.log(`✅ 完了: ${migration}`);
    }
    
    console.log('');
    console.log('✅ スキーマ復元完了！');
    
    // テーブル確認
    const tables = await client`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;
    
    console.log('');
    console.log('📋 作成されたテーブル:');
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ スキーマ復元中にエラー:', error);
    throw error;
  } finally {
    await client.end();
  }
};

// メイン実行
if (require.main === module) {
  restoreSchema();
}

export { restoreSchema };
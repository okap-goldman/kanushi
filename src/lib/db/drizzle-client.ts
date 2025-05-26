import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';
import * as schema from './schema';

// 環境変数を読み込み
config({ path: '.env.local' });

// Drizzle用の直接PostgreSQL接続クライアント
// マイグレーションとシーディング専用

// 環境変数からデータベースURLを取得
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return url;
};

// PostgreSQL接続の設定
export const createDrizzleClient = () => {
  const connectionString = getDatabaseUrl();
  
  // postgres-js クライアントを作成
  const client = postgres(connectionString, {
    max: 1, // マイグレーション用なので接続数は1つで十分
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  // Drizzle ORM インスタンスを作成
  return drizzle(client, { schema });
};

// マイグレーション専用クライアント（スキーマなし）
export const createMigrationClient = () => {
  const connectionString = getDatabaseUrl();
  return postgres(connectionString, {
    max: 1,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
};

// デフォルトエクスポート
export const db = createDrizzleClient();
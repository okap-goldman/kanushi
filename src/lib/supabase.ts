/**
 * Supabaseクライアント設定モジュール
 * 
 * Supabaseへの接続を管理し、アプリケーション全体で使用できるクライアントインスタンスを提供します。
 * サーバーサイド（Node.js）とクライアントサイド（ブラウザ）の両方の環境に対応しています。
 */
import { createClient } from '@supabase/supabase-js';

/**
 * Supabaseサーバーのエンドポイント
 * プロセス環境変数または環境変数から読み取られます
 */
let supabaseUrl: string;

/**
 * SupabaseのAnonymous Key（認証キー）
 * プロセス環境変数または環境変数から読み取られます
 */
let supabaseAnonKey: string;

// Node.js環境とブラウザ環境の両方に対応
if (typeof process !== 'undefined' && process.env) {
  // Node.js環境（サーバーサイド）
  supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
} else {
  // ブラウザ環境（クライアントサイド）
  supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase URL or Anon Key');
  // エラーをスローするのではなく、デフォルト値を使用
  supabaseUrl = supabaseUrl || 'http://localhost:54321';
  supabaseAnonKey = supabaseAnonKey || 'dummy-key';
}

/**
 * アプリケーション全体で使用するSupabaseクライアントインスタンス
 * 
 * このクライアントを通じてデータベース操作、認証などSupabaseの全機能にアクセスできます。
 * 環境変数が設定されていない場合、開発用のローカル接続情報が使用されます。
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

let supabaseUrl: string;
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
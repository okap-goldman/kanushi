import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import dotenv from "dotenv";

// dotenvを使用して環境変数を強制的に読み込む
dotenv.config();

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 環境変数を明示的に読み込む
  const env = loadEnv(mode, process.cwd(), '');
  
  // process.envに.envファイルの内容を追加
  for (const [key, val] of Object.entries(env)) {
    process.env[key] = val;
  }
  
  // Supabase環境変数の値を確認
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  
  console.log('Vite config - Supabase URL:', supabaseUrl ? 'found' : 'not found');
  console.log('Vite config - Supabase Key:', supabaseAnonKey ? 'found' : 'not found');
  
  return {
    define: {
      // 環境変数をクライアントに提供
      'import.meta.env.VITE_SKIP_LOGIN': JSON.stringify(process.env.VITE_SKIP_LOGIN || 'true'),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
    },
    server: {
      host: "::",
      port: 8080,
      cors: true
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

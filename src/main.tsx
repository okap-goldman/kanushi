import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

// 環境変数のデバッグ - 開発モードで表示
if (import.meta.env.DEV) {
  console.log('環境変数チェック:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '設定済み' : '未設定');
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '設定済み' : '未設定');
  console.log('- VITE_SKIP_LOGIN:', import.meta.env.VITE_SKIP_LOGIN);
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

const root = createRoot(rootElement);

root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
/**
 * メインエントリーポイントファイル
 * 
 * Reactアプリケーションのルートコンポーネントをレンダリングするためのエントリーポイントです。
 * StrictModeを有効にしてアプリケーションをレンダリングします。
 */
import { createRoot } from 'react-dom/client'
import { StrictMode } from 'react'
import App from './App.tsx'
import './index.css'

/**
 * ルート要素を取得し、存在しない場合はエラーをスローします
 */
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

/**
 * ルート要素にReactルートを作成します
 */
const root = createRoot(rootElement);

/**
 * アプリケーションをStrictModeでレンダリングします
 */
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
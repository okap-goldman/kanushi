/**
 * サイドバーコンポーネントのカスタムフック
 */
import * as React from "react"
import { SidebarContext } from "./context"

/**
 * サイドバーコンテキストを利用するためのフック
 * @returns {SidebarContext} サイドバーの状態と操作関数を含むコンテキスト
 * @throws サイドバープロバイダー外で使用された場合にエラーをスロー
 */
export const useSidebar = () => {
  const context = React.useContext(SidebarContext)
  
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
} 
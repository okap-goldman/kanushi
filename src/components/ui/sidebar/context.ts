/**
 * サイドバーコンポーネントのReactコンテキスト定義
 */
import * as React from "react"
import { SidebarContext as SidebarContextType } from "./types"

/**
 * サイドバーの状態管理用Reactコンテキスト
 */
export const SidebarContext = React.createContext<SidebarContextType | null>(null) 
/**
 * サイドバーコンポーネントの型定義
 */

/**
 * サイドバーコンテキストの型定義
 */
export type SidebarContext = {
  /** サイドバーの表示状態 */
  state: "expanded" | "collapsed"
  
  /** サイドバーが開いているかどうか */
  open: boolean
  
  /** サイドバーの開閉状態を設定する関数 */
  setOpen: (open: boolean) => void
  
  /** モバイル表示時にサイドバーが開いているかどうか */
  openMobile: boolean
  
  /** モバイル表示時のサイドバー開閉状態を設定する関数 */
  setOpenMobile: (open: boolean) => void
  
  /** 現在の画面がモバイルサイズかどうか */
  isMobile: boolean
  
  /** サイドバーの開閉状態を切り替える関数 */
  toggleSidebar: () => void
} 
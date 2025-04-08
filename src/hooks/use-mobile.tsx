/**
 * モバイルデバイス判定のためのフック提供モジュール
 * 
 * 現在の画面幅がモバイル向けかどうかを判定するためのカスタムフックを提供します。
 * レスポンシブなUIの実装に役立ちます。
 */
import * as React from "react"

/**
 * モバイルデバイスのブレークポイント（ピクセル単位）
 * この値より小さい画面幅はモバイルデバイスとみなされます
 */
const MOBILE_BREAKPOINT = 768

/**
 * 現在の画面がモバイルサイズかを判定するカスタムフック
 * @returns {boolean} 画面幅がモバイルサイズの場合true
 */
export const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (): void => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

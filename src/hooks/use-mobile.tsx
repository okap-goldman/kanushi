/**
 * モバイルデバイス検出フックモジュール
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
 * 現在の画面がモバイルサイズかどうかを判定するカスタムフック
 * 
 * このフックは画面のサイズを監視し、モバイルブレークポイント以下の場合はtrueを返します。
 * コンポーネント内で使用することで、画面サイズに応じた条件付きレンダリングが可能になります。
 * 
 * @returns {boolean} 現在の画面がモバイルサイズの場合はtrue、そうでない場合はfalse
 * 
 * @example
 * function MyComponent() {
 *   const isMobile = useIsMobile();
 *   
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileView />
 *       ) : (
 *         <DesktopView />
 *       )}
 *     </div>
 *   );
 * }
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

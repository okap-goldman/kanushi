/**
 * ボタンコンポーネントモジュール
 * 
 * アプリケーション全体で使用される汎用的なボタンコンポーネントを提供します。
 * 様々なスタイルバリアントとサイズをサポートし、アクセシビリティに配慮しています。
 */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button/variants"

/**
 * ボタンコンポーネントのプロパティ型定義
 * 
 * @interface ButtonProps
 * @extends {React.ButtonHTMLAttributes<HTMLButtonElement>} - 標準のHTMLボタン属性
 * @extends {VariantProps<typeof buttonVariants>} - ボタンのバリアント属性
 * @property {boolean} [asChild] - trueの場合、スロットコンポーネントとして機能し、子要素を包含します
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

/**
 * ボタンコンポーネント
 * 
 * 様々なスタイルバリアントとサイズをサポートする汎用的なボタンです。
 * asChildプロパティを使用して、子コンポーネントをボタンのスタイルで包むことができます。
 * 
 * @param {ButtonProps} props - ボタンのプロパティ
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {string} [props.variant] - ボタンのスタイルバリアント
 * @param {string} [props.size] - ボタンのサイズ
 * @param {boolean} [props.asChild=false] - 子要素をスロットとして使用するかどうか
 * @param {React.Ref<HTMLButtonElement>} ref - フォワードされたref
 * @returns {JSX.Element} ボタンコンポーネント
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

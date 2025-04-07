/**
 * カードコンポーネントモジュール
 * 
 * アプリケーション全体で使用される汎用的なカードコンポーネントセットを提供します。
 * コンテンツをグループ化し、視覚的に区切るための一貫したデザインパターンを実装しています。
 */
import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * カードコンポーネント
 * 
 * 関連するコンテンツをグループ化するためのコンテナです。
 * 境界線、背景、シャドウなどの基本的なスタイルを提供します。
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - divの標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLDivElement>} ref - フォワードされたref
 * @returns {JSX.Element} カードコンポーネント
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/**
 * カードヘッダーコンポーネント
 * 
 * カードの上部セクションを表示するためのコンポーネントです。
 * 通常、タイトルと説明を含みます。
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - divの標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLDivElement>} ref - フォワードされたref
 * @returns {JSX.Element} カードヘッダーコンポーネント
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * カードタイトルコンポーネント
 * 
 * カード内のメインタイトルを表示するためのコンポーネントです。
 * 視覚的な強調とタイポグラフィのスタイルを適用します。
 * 
 * @param {React.HTMLAttributes<HTMLHeadingElement>} props - h3の標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLParagraphElement>} ref - フォワードされたref
 * @returns {JSX.Element} カードタイトルコンポーネント
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * カード説明コンポーネント
 * 
 * カードのタイトルを補足する説明テキストを表示するためのコンポーネントです。
 * 小さめのフォントサイズと控えめな色で表示されます。
 * 
 * @param {React.HTMLAttributes<HTMLParagraphElement>} props - pの標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLParagraphElement>} ref - フォワードされたref
 * @returns {JSX.Element} カード説明コンポーネント
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * カードコンテンツコンポーネント
 * 
 * カードのメインコンテンツを表示するためのコンポーネントです。
 * ヘッダーの下に配置され、適切なパディングを適用します。
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - divの標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLDivElement>} ref - フォワードされたref
 * @returns {JSX.Element} カードコンテンツコンポーネント
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * カードフッターコンポーネント
 * 
 * カードの下部セクションを表示するためのコンポーネントです。
 * 通常、アクションボタンや追加情報を含みます。
 * 
 * @param {React.HTMLAttributes<HTMLDivElement>} props - divの標準属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<HTMLDivElement>} ref - フォワードされたref
 * @returns {JSX.Element} カードフッターコンポーネント
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

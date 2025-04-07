/**
 * タブコンポーネントモジュール
 * 
 * アプリケーション全体で使用される汎用的なタブインターフェースコンポーネントを提供します。
 * Radix UIのタブプリミティブをベースにしたアクセシブルなタブ実装です。
 */
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * タブのルートコンポーネント
 * 
 * タブインターフェースのコンテナとして機能します。
 * 子コンポーネントとしてTabsList、TabsTrigger、TabsContentを含みます。
 */
const Tabs = TabsPrimitive.Root

/**
 * タブリストコンポーネント
 * 
 * タブトリガー（タブボタン）を含むコンテナです。
 * 水平方向のナビゲーションリストとして表示されます。
 * 
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>} props - TabsPrimitiveのList属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.List>>} ref - フォワードされたref
 * @returns {JSX.Element} タブリストコンポーネント
 */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * タブトリガーコンポーネント
 * 
 * 個々のタブボタンを表示します。クリックすると対応するタブコンテンツが表示されます。
 * アクティブな状態と非アクティブな状態のスタイリングを含みます。
 * 
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>} props - TabsPrimitiveのTrigger属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Trigger>>} ref - フォワードされたref
 * @returns {JSX.Element} タブトリガーコンポーネント
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * タブコンテンツコンポーネント
 * 
 * 特定のタブが選択されたときに表示されるコンテンツを含みます。
 * 対応するTabsTriggerがアクティブになったときのみ表示されます。
 * 
 * @param {React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>} props - TabsPrimitiveのContent属性
 * @param {string} [props.className] - 追加のCSSクラス名
 * @param {React.Ref<React.ElementRef<typeof TabsPrimitive.Content>>} ref - フォワードされたref
 * @returns {JSX.Element} タブコンテンツコンポーネント
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

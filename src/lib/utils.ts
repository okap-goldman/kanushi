/**
 * ユーティリティ関数モジュール
 * 
 * アプリケーション全体で使用される共通ユーティリティ関数を提供します。
 */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * クラス名を結合するユーティリティ関数
 * 
 * clsxとtailwind-mergeを組み合わせて、条件付きクラス名を効率的に結合します。
 * Tailwindのクラス名の衝突を解決し、最適化された形で結合します。
 * 
 * @param {...ClassValue[]} inputs - 結合するクラス名（配列、オブジェクト、文字列など）
 * @returns {string} 最適化された結合クラス名
 * 
 * @example
 * // 基本的な使用方法
 * cn('text-red-500', 'bg-blue-200')
 * // => 'text-red-500 bg-blue-200'
 * 
 * @example
 * // 条件付きクラス
 * cn('text-base', { 'text-red-500': isError, 'text-green-500': isSuccess })
 * // isErrorがtrueの場合 => 'text-base text-red-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

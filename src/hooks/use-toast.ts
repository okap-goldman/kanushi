/**
 * トースト通知システムモジュール
 * 
 * アプリケーション全体で使用できるトースト通知機能を提供します。
 * このモジュールは通知の表示、更新、削除などの操作を管理します。
 */
import * as React from "react"

import type {
  ToastActionElement,
  ToastProps,
} from "@/components/ui/toast"

/**
 * 同時に表示できるトーストの最大数
 */
const TOAST_LIMIT = 1

/**
 * トーストが非表示になってから完全に削除されるまでの遅延時間（ミリ秒）
 */
const TOAST_REMOVE_DELAY = 1000000

/**
 * トースト通知の型定義
 * 
 * @typedef {Object} ToasterToast
 * @property {string} id - トースト通知の一意識別子
 * @property {React.ReactNode} [title] - トースト通知のタイトル
 * @property {React.ReactNode} [description] - トースト通知の詳細説明
 * @property {ToastActionElement} [action] - トースト通知に表示するアクション要素
 */
type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

/**
 * トースト通知のアクションタイプ定数
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let count = 0

/**
 * トースト通知の一意識別子を生成する関数
 * 
 * @returns {string} 生成された一意識別子
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

/**
 * アクションタイプの型
 */
type ActionType = typeof actionTypes

/**
 * トースト通知の状態を更新するアクションの型定義
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"]
      toast: ToasterToast
    }
  | {
      type: ActionType["UPDATE_TOAST"]
      toast: Partial<ToasterToast>
    }
  | {
      type: ActionType["DISMISS_TOAST"]
      toastId?: ToasterToast["id"]
    }
  | {
      type: ActionType["REMOVE_TOAST"]
      toastId?: ToasterToast["id"]
    }

/**
 * トースト通知の状態を表す型定義
 * 
 * @interface State
 * @property {ToasterToast[]} toasts - 現在表示中のトースト通知の配列
 */
interface State {
  toasts: ToasterToast[]
}

/**
 * トースト通知のタイムアウトを保持するマップ
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

/**
 * トースト通知を削除キューに追加する関数
 * 
 * @param {string} toastId - 削除するトースト通知のID
 */
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * トースト通知の状態を更新するリデューサー関数
 * 
 * @param {State} state - 現在の状態
 * @param {Action} action - 実行するアクション
 * @returns {State} 更新された状態
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
  }
}

/**
 * 状態変更をリッスンする関数の配列
 */
const listeners: Array<(state: State) => void> = []

/**
 * メモリに保持されているトースト通知の状態
 */
let memoryState: State = { toasts: [] }

/**
 * アクションをディスパッチし、状態を更新する関数
 * 
 * @param {Action} action - ディスパッチするアクション
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * トースト通知の型（ID以外）
 */
type Toast = Omit<ToasterToast, "id">

/**
 * トースト通知を作成する関数
 * 
 * @param {Toast} props - トースト通知のプロパティ
 * @returns {Object} トースト通知の制御オブジェクト
 * @returns {string} id - 作成されたトースト通知のID
 * @returns {Function} dismiss - トースト通知を閉じる関数
 * @returns {Function} update - トースト通知を更新する関数
 */
function toast({ ...props }: Toast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * トースト通知を使用するためのカスタムフック
 * 
 * このフックを使用すると、コンポーネント内からトースト通知を表示、更新、削除できます。
 * 
 * @returns {Object} トースト通知の状態と操作関数を含むオブジェクト
 * @returns {ToasterToast[]} toasts - 現在表示中のトースト通知の配列
 * @returns {Function} toast - 新しいトースト通知を作成する関数
 * @returns {Function} dismiss - 指定されたトースト通知または全てのトースト通知を閉じる関数
 * 
 * @example
 * function MyComponent() {
 *   const { toast } = useToast();
 *   
 *   const showToast = () => {
 *     toast({
 *       title: "成功",
 *       description: "操作が完了しました",
 *       variant: "default",
 *     });
 *   };
 *   
 *   return <button onClick={showToast}>通知を表示</button>;
 * }
 */
function useToast() {
  const [state, setState] = React.useState<State>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { useToast, toast }

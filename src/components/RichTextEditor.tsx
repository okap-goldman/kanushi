/**
 * リッチテキストエディタモジュール
 * 
 * シンプルなリッチテキストエディタコンポーネントを提供します。
 * Tiptapライブラリを使用して、テキストの書式設定機能（太字、斜体など）を備えています。
 */
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';

/**
 * リッチテキストエディタのプロパティ型定義
 * 
 * @typedef {Object} RichTextEditorProps
 * @property {Object} content - エディタのコンテンツ
 * @property {string} content.text - プレーンテキスト形式のコンテンツ
 * @property {string} content.html - HTML形式のコンテンツ
 * @property {Function} onChange - コンテンツが変更されたときのコールバック関数
 */
interface RichTextEditorProps {
  content: {
    text: string;
    html: string;
  };
  onChange: (content: { text: string; html: string }) => void;
}

/**
 * リッチテキストエディタコンポーネント
 * 
 * テキストの書式設定（太字、斜体）が可能なエディタを提供します。
 * エディタの内容が変更されると、onChange関数を通じてテキストとHTML形式の内容が親コンポーネントに通知されます。
 * 
 * @param {RichTextEditorProps} props - リッチテキストエディタのプロパティ
 * @param {Object} props.content - 初期コンテンツ（テキストとHTML）
 * @param {Function} props.onChange - コンテンツ変更時のコールバック
 * @returns {JSX.Element} リッチテキストエディタコンポーネント
 */
export const RichTextEditor = ({ content, onChange }: RichTextEditorProps) => {
  /**
   * Tiptapエディタのインスタンスを作成
   * 必要な拡張機能を設定し、コンテンツの初期値とアップデートハンドラを設定します
   */
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false,
        code: false,
        codeBlock: false,
        blockquote: false,
      }),
      Bold,
      Italic,
    ],
    content: content.html,
    onUpdate: ({ editor }) => {
      onChange({
        text: editor.getText(),
        html: editor.getHTML(),
      });
    },
  });

  return (
    <div className="border rounded-md p-4">
      <div className="flex gap-2 mb-4 border-b pb-2">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded ${
            editor?.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          太字
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded ${
            editor?.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'
          }`}
          type="button"
        >
          斜体
        </button>
      </div>
      <EditorContent 
        editor={editor} 
        className="h-[400px] [&_.ProseMirror]:h-full [&_.ProseMirror]:w-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:p-0"
      />
    </div>
  );
};

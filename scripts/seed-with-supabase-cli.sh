#!/bin/bash

# 日本語のスピリチュアル系モックデータをSupabase CLIで適用するスクリプト
# 
# 前提条件:
# - Supabase CLIがインストールされていること
# - supabase login が完了していること
# - supabase link でプロジェクトがリンクされていること

echo "🌟 日本語モックデータの適用を開始します（Supabase CLI版）..."

# Supabase CLIがインストールされているか確認
if ! command -v supabase &> /dev/null; then
    echo "❌ エラー: Supabase CLIがインストールされていません。"
    echo "インストール方法: https://supabase.com/docs/guides/cli"
    exit 1
fi

# プロジェクトがリンクされているか確認
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "❌ エラー: Supabaseプロジェクトがリンクされていません。"
    echo "実行してください: supabase link --project-ref [your-project-ref]"
    exit 1
fi

MIGRATION_FILE="supabase/migrations/013_seed_japanese_mock_data.sql"

# マイグレーションファイルの存在確認
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ エラー: マイグレーションファイルが見つかりません: $MIGRATION_FILE"
    exit 1
fi

echo "⏳ データベースにモックデータを挿入中..."

# Supabase CLIを使用してSQLを実行
if supabase db push --include-seed; then
    echo "✅ モックデータの適用が完了しました！"
    echo ""
    echo "📊 挿入されたデータ:"
    echo "  - 8人のスピリチュアル系プロフィール"
    echo "  - 10件の投稿（音声・テキスト）"
    echo "  - 15個のハッシュタグ"
    echo "  - 4件のイベント"
    echo "  - コメント、いいね、フォロー関係"
    echo "  - 2件のストーリーズ"
    echo ""
    echo "🎉 Kanushiアプリで日本語のモックデータを確認できます！"
else
    echo "❌ エラーが発生しました。"
    echo ""
    echo "💡 ヒント:"
    echo "1. supabase login が完了しているか確認してください"
    echo "2. supabase link でプロジェクトがリンクされているか確認してください"
    echo "3. 既にデータが存在する場合は、重複エラーになる可能性があります"
    exit 1
fi
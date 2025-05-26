#!/bin/bash

# Supabase CLIを使用してモックデータをシードするスクリプト

echo "🌟 Supabase CLIでモックデータをシードします..."

# プロジェクトがリンクされているか確認
if [ ! -f "supabase/.temp/project-ref" ]; then
    echo "❌ エラー: Supabaseプロジェクトがリンクされていません"
    echo "次のコマンドを実行してください:"
    echo "supabase link --project-ref dpmrgzjvljaacdwggnaf"
    exit 1
fi

# プロジェクト参照を確認
PROJECT_REF=$(cat supabase/.temp/project-ref 2>/dev/null)
if [ -z "$PROJECT_REF" ]; then
    echo "❌ エラー: プロジェクト参照が見つかりません"
    echo "supabase linkを再実行してください"
    exit 1
fi

echo "✅ プロジェクト $PROJECT_REF にリンクされています"

# .env.localファイルから環境変数を読み込む
if [ -f ".env.local" ]; then
    echo "📄 .env.localから環境変数を読み込み中..."
    # .env.localファイルを読み込み、コメントと空行を除外
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
fi

# 環境変数のマッピング（EXPO_PUBLIC_プレフィックスを考慮）
if [ -n "$EXPO_PUBLIC_SUPABASE_URL" ]; then
    SUPABASE_URL="$EXPO_PUBLIC_SUPABASE_URL"
fi

# 環境変数の確認
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ エラー: 必要な環境変数が設定されていません"
    echo ""
    echo "以下の環境変数を.env.localファイルに追加してください:"
    echo ""
    echo "# For seeding (Supabase Dashboard > Settings > API から取得)"
    echo "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here"
    echo ""
    echo "または、既存の環境変数を使用:"
    echo "SUPABASE_URL=$EXPO_PUBLIC_SUPABASE_URL"
    echo ""
    echo "Service Role Keyは以下から取得できます:"
    echo "https://app.supabase.com/project/$PROJECT_REF/settings/api"
    echo "「service_role」の「Reveal」をクリックしてキーをコピー"
    exit 1
fi

# ステップ1: Authユーザーを作成
echo "👤 ステップ1: Authユーザーを作成中..."
node scripts/seed-auth-users.js

if [ $? -ne 0 ]; then
    echo "❌ Authユーザーの作成に失敗しました"
    exit 1
fi

# ステップ2: マイグレーションファイルを実行
echo ""
echo "📊 ステップ2: モックデータを適用中..."

# データベースパスワードを環境変数から取得、または.env.localから読み込み
if [ -z "$SUPABASE_DB_PASSWORD" ] && [ -f ".env.local" ]; then
    SUPABASE_DB_PASSWORD=$(grep "SUPABASE_DB_PASSWORD" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
fi

# psqlを使用してSQLファイルを実行
if command -v psql &> /dev/null; then
    # psqlがインストールされている場合
    if [ -n "$SUPABASE_DB_PASSWORD" ]; then
        # リモートデータベースのURLを構築（Pooler接続を使用）
        DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
        psql "$DATABASE_URL" -f supabase/migrations/014_seed_japanese_mock_data_current_schema.sql
    else
        echo "❌ データベースパスワードが設定されていません"
        echo ""
        echo "以下のいずれかの方法でパスワードを設定してください:"
        echo ""
        echo "方法1: .env.localに追加"
        echo "SUPABASE_DB_PASSWORD=your_database_password"
        echo ""
        echo "方法2: 環境変数として設定"
        echo "export SUPABASE_DB_PASSWORD=your_database_password"
        echo ""
        echo "パスワードは以下から取得できます:"
        echo "https://app.supabase.com/project/$PROJECT_REF/settings/database"
        echo "「Connection string」セクションの「Database Password」から「Reveal」をクリック"
        echo ""
        echo "または、Supabase SQL Editorを使用して手動で実行:"
        echo "https://app.supabase.com/project/$PROJECT_REF/sql"
        exit 1
    fi
else
    echo "📝 psqlがインストールされていません。"
    echo ""
    echo "以下の方法でモックデータを適用してください:"
    echo ""
    echo "方法1: Supabase SQL Editorを使用（推奨）"
    echo "1. https://app.supabase.com/project/$PROJECT_REF/sql にアクセス"
    echo "2. supabase/migrations/014_seed_japanese_mock_data_current_schema.sql の内容をコピー&ペースト"
    echo "3. 「Run」をクリック"
    echo ""
    echo "方法2: psqlをインストールして再実行"
    echo "brew install postgresql (macOS)"
    echo "その後、このスクリプトを再実行"
    exit 0
fi

if [ $? -eq 0 ]; then
    echo "✅ モックデータの適用が完了しました！"
    echo ""
    echo "📊 挿入されたデータ:"
    echo "  - 8人のスピリチュアル系プロフィール" 
    echo "  - 10件の投稿（音声・テキスト）"
    echo "  - 15個のハッシュタグ"
    echo "  - 4件のイベント"
    echo "  - コメント、いいね、フォロー関係"
    echo "  - 8件のストーリーズ（画像/テキスト）"
    echo "  - ストーリービューワー、リアクション、リプライ"
    echo ""
    echo "🎉 Kanushiアプリで日本語のモックデータを確認できます！"
    echo ""
    echo "🔐 テストアカウントの認証情報:"
    echo "メールアドレス: [name]@kanushi-test.com"
    echo "パスワード: test-password-123"
else
    echo "❌ エラーが発生しました"
    echo "詳細はエラーメッセージを確認してください"
    exit 1
fi
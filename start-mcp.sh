#!/bin/bash

# エラー時に停止
set -e

echo "🎭 プロジェクト固有のPlaywright MCPサーバを起動します..."

# 特定のポートのプロセスを確認
PORT=4455
PORT_PID=$(lsof -i:$PORT -t 2>/dev/null || echo "")

# 既存のプロセスがあれば終了
if [ -n "$PORT_PID" ]; then
  echo "ポート $PORT で実行中のプロセス $PORT_PID を終了します"
  kill -9 $PORT_PID || true
fi

# SingletonLockファイルを削除
PROFILE_DIR="/tmp/kanushi-playwright-profile"
LOCK_FILE="$PROFILE_DIR/SingletonLock"

if [ -f "$LOCK_FILE" ]; then
  echo "SingletonLockファイルを削除します: $LOCK_FILE"
  rm -f "$LOCK_FILE"
fi

# ディレクトリがなければ作成
mkdir -p "$PROFILE_DIR"

# 環境変数を設定してMCPサーバを起動
export PLAYWRIGHT_BROWSERS_PATH="/tmp/kanushi-playwright-browsers"
export PLAYWRIGHT_MCP_PROFILE_DIR="$PROFILE_DIR"

echo "Playwright MCPをポート $PORT で起動します..."
npx @executeautomation/playwright-mcp-server --port $PORT &

# PIDを保存
echo $! > .mcp-pid

echo "✅ Playwright MCPサーバは起動しました（PID: $(cat .mcp-pid)）"
echo "   プロファイルディレクトリ: $PROFILE_DIR"
echo "   ブラウザディレクトリ: $PLAYWRIGHT_BROWSERS_PATH"
echo "   停止するには: bash stop-mcp.sh を実行してください" 
#!/bin/bash

echo "🛑 Playwright MCPサーバを停止しています..."

# PIDファイルから起動したMCPプロセスを終了
if [ -f .mcp-pid ]; then
  PID=$(cat .mcp-pid)
  if ps -p $PID > /dev/null; then
    echo "PID $PID のプロセスを終了しています..."
    kill $PID || true
    rm .mcp-pid
  else
    echo "PID $PID のプロセスは既に終了しています"
    rm .mcp-pid
  fi
fi

# 特定のポートで実行中のプロセスを確認して終了
PORT=4455
PORT_PID=$(lsof -i:$PORT -t 2>/dev/null || echo "")

if [ -n "$PORT_PID" ]; then
  echo "ポート $PORT で実行中のプロセス $PORT_PID を終了します"
  kill -9 $PORT_PID || true
fi

# ポートが解放されたことを確認
PORT_CHECK=$(lsof -i:$PORT -t 2>/dev/null || echo "")
if [ -n "$PORT_CHECK" ]; then
  echo "⚠️ ポート $PORT はまだ使用中です。プロセス $PORT_CHECK が実行中です。"
else
  echo "✅ ポート $PORT は解放されました"
fi

echo "Playwright MCPサーバは停止しました" 
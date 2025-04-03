import { defineConfig } from '@playwright/test';
import path from 'path';
import os from 'os';

// プロジェクト固有のMCPの設定
export const mcpConfig = {
  // ポート番号を変更して競合を避ける
  port: 4455,
  
  // プロジェクト固有のプロファイルディレクトリ
  userDataDir: path.join(os.tmpdir(), 'kanushi-playwright-profile'),
  
  // その他のMCP関連設定
  serverArgs: ['-y', '@executeautomation/playwright-mcp-server', '--port', '4455'],
  
  // MCP設定ファイルのパス
  configPath: path.join(process.cwd(), 'mcp.config.json')
};

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4488',
    trace: 'on-first-retry',
    video: 'on-first-retry',
    screenshot: 'only-on-failure',
    contextOptions: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  },
  projects: [
    {
      name: 'chromium',
      use: { 
        browserName: 'chromium',
        launchOptions: {
          headless: false,
          args: [
            `--user-data-dir=${mcpConfig.userDataDir}`,
            '--no-sandbox',
            `--remote-debugging-port=${mcpConfig.port}`
          ]
        }
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4488',
    reuseExistingServer: true,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 
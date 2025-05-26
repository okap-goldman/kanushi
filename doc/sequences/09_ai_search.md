# AIチャット・検索機能シーケンス図

## 1. 全文検索（ユーザー/投稿/ハッシュタグ）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant PG_FTS as PG Full-Text Search

    User->>App: 検索画面を開く
    App->>User: 検索画面表示
    
    User->>App: 検索キーワード入力
    App->>App: デバウンス処理（300ms）
    
    User->>App: 検索タイプ選択（すべて/ユーザー/投稿/イベント）
    App->>API: GET /search?q={query}&type={type}
    
    API->>DB: INSERT INTO search_history
    note right of DB: ユーザーの検索履歴を保存
    
    alt ユーザー検索
        API->>PG_FTS: SELECT FROM profiles WHERE ts_vector @@ query
        PG_FTS->>API: マッチしたユーザーリスト
    else 投稿検索
        API->>PG_FTS: SELECT FROM posts WHERE ts_vector @@ query
        PG_FTS->>API: マッチした投稿リスト
        API->>DB: ハッシュタグも検索
        DB->>API: ハッシュタグ経由の投稿
    else イベント検索
        API->>PG_FTS: SELECT FROM events WHERE ts_vector @@ query
        PG_FTS->>API: マッチしたイベントリスト
    end
    
    API->>API: 結果のスコアリング・ソート
    API->>App: 検索結果（カーソルページネーション）
    App->>User: 検索結果表示
    
    User->>App: さらに読み込む
    App->>API: GET /search?q={query}&cursor={nextCursor}
    API->>App: 次ページの結果
    App->>User: 追加結果表示
```

## 2. 検索履歴管理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 検索入力フィールドフォーカス
    App->>API: GET /search/history
    API->>DB: SELECT FROM search_history ORDER BY searched_at DESC
    DB->>API: 最近の検索履歴（最大10件）
    API->>App: 検索履歴リスト
    App->>User: 検索履歴表示
    
    alt 履歴から選択
        User->>App: 検索履歴アイテムタップ
        App->>App: 検索キーワードセット
        App->>API: GET /search?q={query}
        API->>App: 検索結果
        App->>User: 結果表示
    else 履歴削除
        User->>App: 履歴アイテム左スワイプ
        App->>User: 削除ボタン表示
        User->>App: 削除確認
        App->>API: DELETE /search/history/{historyId}
        API->>DB: DELETE FROM search_history
        DB->>API: 削除完了
        API->>App: 削除確認
        App->>User: リストから削除
    end
```

## 3. AIチャット（Gemini-2.5-Pro）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Gemini as Gemini-2.5-Pro API

    User->>App: AIチャット画面を開く
    App->>API: GET /chat/sessions?limit=3
    API->>DB: SELECT FROM chat_sessions WHERE user_id ORDER BY updated_at DESC LIMIT 3
    note right of DB: 最新3件のチャット履歴を取得
    DB->>API: 直近3件のセッション
    API->>App: セッション一覧（最大3件）
    App->>User: チャット履歴表示（直近3件）
    note right of User: 各セッションには<br/>- セッションタイトル<br/>- 最終メッセージプレビュー<br/>- 最終更新日時
    
    alt 新規セッション
        User->>App: 新規チャット開始
        App->>API: POST /chat/sessions
        API->>DB: INSERT INTO chat_sessions
        DB->>API: セッションID
        API->>App: 新規セッション情報
    else 既存セッション継続
        User->>App: チャット履歴項目タップ
        note right of User: 直近3件から選択
        App->>API: GET /chat/sessions/{sessionId}/messages
        API->>DB: SELECT FROM chat_messages WHERE session_id ORDER BY created_at ASC
        DB->>API: メッセージ履歴
        API->>App: チャット履歴
        App->>User: メッセージ詳細表示
        note right of User: 選択したセッションの<br/>全メッセージを表示
    end
    
    User->>App: メッセージ入力
    User->>App: 送信ボタン
    App->>User: 送信中表示
    App->>API: POST /chat/sessions/{sessionId}/messages
    
    API->>DB: INSERT INTO chat_messages (role: user)
    API->>DB: 最近のメッセージ取得（コンテキスト用）
    DB->>API: 過去のメッセージ（最大10件）
    
    API->>API: プロンプト構築
    note right of API: システムプロンプト +<br/>過去のコンテキスト +<br/>ユーザーメッセージ
    
    API->>Gemini: メッセージ送信
    note right of Gemini: temperature: 0.7<br/>max_tokens: 2048
    
    alt 通常の応答
        Gemini->>API: テキスト応答
        API->>DB: INSERT INTO chat_messages (role: assistant)
        API->>App: AIレスポンス
        App->>User: 応答表示
    else 関数呼び出し（検索など）
        Gemini->>API: 関数呼び出しリクエスト
        API->>API: 関数実行（投稿検索など）
        API->>DB: 検索クエリ実行
        DB->>API: 検索結果
        API->>Gemini: 関数実行結果
        Gemini->>API: 最終応答
        API->>DB: INSERT INTO chat_messages
        note right of DB: function_calls フィールドに<br/>関数呼び出し情報を保存
        API->>App: AIレスポンス
        App->>User: 応答表示（検索結果含む）
    end
```

## 4. AIチャット - 高度な機能

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Gemini as Gemini-2.5-Pro API

    User->>App: 「おすすめの投稿を教えて」
    App->>API: POST /chat/sessions/{sessionId}/messages
    
    API->>Gemini: ユーザーリクエスト送信
    Gemini->>API: function: search_posts
    
    API->>DB: ユーザーの興味・履歴分析
    note right of DB: - いいねした投稿<br/>- ハイライトした投稿<br/>- フォローしているユーザー
    DB->>API: ユーザー嗜好データ
    
    API->>DB: 関連投稿検索
    DB->>API: おすすめ投稿リスト
    
    API->>Gemini: 検索結果送信
    Gemini->>API: パーソナライズされた推薦文
    
    API->>DB: INSERT INTO chat_messages
    API->>App: AIレスポンス + 投稿リスト
    App->>User: おすすめ投稿表示
    
    User->>App: 「イベントを探して」
    App->>API: POST /chat/sessions/{sessionId}/messages
    
    API->>Gemini: イベント検索リクエスト
    Gemini->>API: function: search_events + location
    
    API->>DB: 近隣イベント検索
    DB->>API: イベントリスト
    
    API->>Gemini: イベント情報送信
    Gemini->>API: イベント推薦文
    
    API->>App: AIレスポンス + イベント情報
    App->>User: イベント一覧表示
    
    User->>App: 「通知設定を変更したい」
    App->>API: POST /chat/sessions/{sessionId}/messages
    
    API->>Gemini: 設定変更リクエスト
    Gemini->>API: 設定手順の説明
    
    API->>App: 設定画面への導線を含む応答
    App->>User: 設定手順表示 + ボタン
    User->>App: 設定画面へ移動ボタン
    App->>User: 設定画面に遷移
```

## 5. パーソナルAIキュレーター（CRON）

```mermaid
sequenceDiagram
    participant CRON as CRON Job
    participant Worker as Edge Function Worker
    participant DB as PostgreSQL
    participant Gemini as Gemini-2.5-Pro API
    participant FCM as Firebase Cloud Messaging

    CRON->>Worker: 毎朝5:00 JST トリガー
    Worker->>DB: アクティブユーザー取得
    note right of DB: 過去7日間にログインした<br/>ユーザーを対象
    DB->>Worker: ユーザーリスト
    
    loop 各ユーザーごと
        Worker->>DB: ユーザーの行動履歴取得
        note right of DB: - 視聴履歴<br/>- いいね履歴<br/>- フォロー情報<br/>- 時間帯別アクティビティ
        DB->>Worker: 行動データ
        
        Worker->>Worker: ユーザープロファイル分析
        Worker->>Gemini: キュレーション依頼
        note right of Gemini: プロンプト:<br/>- ユーザーの嗜好<br/>- 最近のトレンド<br/>- 未視聴の優良コンテンツ
        
        Gemini->>Worker: おすすめ投稿ID（5-10件）
        
        Worker->>DB: SELECT FROM posts WHERE id IN (...)
        DB->>Worker: 投稿詳細データ
        
        Worker->>Worker: プレイリスト構築
        Worker->>DB: INSERT INTO ai_playlists
        DB->>Worker: プレイリストID
        
        Worker->>DB: INSERT INTO ai_playlist_posts
        note right of DB: プレイリストと投稿の<br/>関連付け
        
        Worker->>DB: ユーザーのFCMトークン取得
        DB->>Worker: FCMトークン
        
        alt プッシュ通知ON
            Worker->>FCM: 通知送信
            note right of FCM: 「今日のおすすめ投稿が<br/>届きました🌟」
            FCM->>Worker: 送信完了
        end
    end
    
    Worker->>DB: 処理完了ログ記録
    Worker->>CRON: ジョブ完了
```

## 6. MyRadio生成

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL
    participant Worker as Edge Function
    participant Gemini as Gemini-2.5-Pro API

    User->>App: MyRadioタブを開く
    App->>API: GET /ai/radio
    
    API->>DB: 既存のMyRadioチェック
    alt 有効なMyRadioあり
        DB->>API: 既存プレイリスト
        API->>App: MyRadioデータ
        App->>User: MyRadio表示
    else MyRadio生成必要
        API->>Worker: MyRadio生成リクエスト
        
        Worker->>DB: ユーザーの長期視聴傾向分析
        note right of DB: - お気に入りクリエイター<br/>- 視聴時間帯<br/>- 音声の長さ傾向<br/>- テーマ傾向
        DB->>Worker: 分析データ
        
        Worker->>DB: 類似ユーザー抽出
        DB->>Worker: 類似ユーザーの視聴データ
        
        Worker->>Gemini: ラジオ番組構成依頼
        note right of Gemini: 「通勤時間に最適な<br/>30分のプレイリスト」<br/>「寝る前のリラックス<br/>プレイリスト」など
        
        Gemini->>Worker: プレイリスト構成案
        
        Worker->>DB: 候補投稿の検索・フィルタリング
        note right of DB: - 未視聴優先<br/>- 評価の高い投稿<br/>- 多様性確保
        DB->>Worker: 投稿リスト
        
        Worker->>Worker: 最適な順序で並び替え
        note right of Worker: - 導入<br/>- メインコンテンツ<br/>- クロージング
        
        Worker->>DB: INSERT INTO ai_playlists (type: radio)
        DB->>Worker: プレイリストID
        
        Worker->>API: 生成完了
        API->>App: 新規MyRadio
        App->>User: MyRadio再生開始
    end
    
    User->>App: オフライン保存ボタン
    App->>API: POST /offline-content/playlist/{playlistId}
    API->>DB: プレイリスト内の音声URL取得
    DB->>API: 音声URLリスト
    
    API->>App: ダウンロードURL一覧
    App->>App: バックグラウンドダウンロード
    App->>App: 暗号化してローカル保存
    App->>User: オフライン保存完了通知
```

## 7. ヒットチャート生成

```mermaid
sequenceDiagram
    participant CRON as CRON Job
    participant Worker as Edge Function Worker
    participant DB as PostgreSQL
    participant Cache as Redis Cache

    CRON->>Worker: 毎時0分トリガー
    
    Worker->>Worker: 集計期間の決定
    note right of Worker: 総合Top50: 過去7日間<br/>急上昇Top20: 過去24時間
    
    Worker->>DB: 総合Top50集計クエリ
    note right of DB: SELECT posts.*,<br/>  COUNT(likes) * 1 +<br/>  COUNT(highlights) * 3 +<br/>  COUNT(comments) * 2 +<br/>  play_count * 0.1<br/>AS score<br/>ORDER BY score DESC<br/>LIMIT 50
    DB->>Worker: 総合ランキングデータ
    
    Worker->>DB: 前回のランキング取得
    DB->>Worker: 前回ランキング
    Worker->>Worker: 順位変動計算
    
    Worker->>DB: 急上昇Top20集計クエリ
    note right of DB: 24時間の<br/>エンゲージメント増加率で<br/>ソート
    DB->>Worker: 急上昇ランキングデータ
    
    Worker->>Worker: チャートメタデータ生成
    note right of Worker: - 各投稿のスコア<br/>- 順位変動<br/>- トレンドタグ
    
    Worker->>DB: INSERT INTO hit_charts
    DB->>Worker: チャートID
    
    Worker->>Cache: チャートデータキャッシュ
    note right of Cache: TTL: 1時間
    Cache->>Worker: キャッシュ完了
    
    Worker->>DB: 古いチャートデータ削除
    note right of DB: 7日以上前のデータを削除
    
    Worker->>CRON: ジョブ完了
```

## 8. ヒットチャート表示

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Cache as Redis Cache
    participant DB as PostgreSQL

    User->>App: 発見タブ → ヒットチャート
    App->>User: カテゴリ選択UI表示
    
    User->>App: 「総合Top50」選択
    App->>API: GET /ai/hit-charts?category=top50
    
    API->>Cache: キャッシュチェック
    alt キャッシュヒット
        Cache->>API: キャッシュデータ
        API->>App: ヒットチャートデータ
    else キャッシュミス
        API->>DB: 最新チャート取得
        DB->>API: チャートデータ
        API->>Cache: キャッシュ更新
        API->>App: ヒットチャートデータ
    end
    
    App->>User: ランキング表示
    note right of User: 1. 🥇 投稿タイトル ↑3<br/>2. 🥈 投稿タイトル ↓1<br/>3. 🥉 投稿タイトル NEW
    
    User->>App: 投稿をタップ
    App->>User: 投稿詳細画面へ遷移
    
    User->>App: 「急上昇Top20」に切替
    App->>API: GET /ai/hit-charts?category=rising20
    API->>App: 急上昇チャート
    App->>User: 急上昇ランキング表示
```

## 9. AI音声要約生成

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Worker as Edge Function
    participant Storage as B2 Storage
    participant Whisper as Whisper API
    participant Gemini as Gemini-2.5-Pro API
    participant DB as PostgreSQL

    User->>App: 音声投稿を作成
    App->>API: POST /posts (音声ファイル)
    
    API->>Storage: 音声ファイルアップロード
    Storage->>API: 音声URL
    
    API->>DB: INSERT INTO posts
    DB->>API: 投稿ID
    
    API->>Worker: 非同期で要約生成タスク
    API->>App: 投稿作成完了（要約生成中）
    
    Worker->>Storage: 音声ファイル取得
    Storage->>Worker: 音声データ
    
    Worker->>Whisper: 音声→テキスト変換
    note right of Whisper: 日本語認識モード
    Whisper->>Worker: 文字起こしテキスト
    
    Worker->>Gemini: 要約生成リクエスト
    note right of Gemini: プロンプト:<br/>- 100文字以内で要約<br/>- キーポイント抽出<br/>- 感情トーン分析
    
    Gemini->>Worker: 要約データ
    note right of Worker: {<br/>  summary: "要約文",<br/>  tags: ["タグ1", "タグ2"],<br/>  recommendedViewers: ["初心者", "瞑想好き"]<br/>}
    
    Worker->>DB: UPDATE posts SET ai_metadata
    DB->>Worker: 更新完了
    
    Worker->>API: 要約生成完了通知
    
    App->>API: 投稿データ再取得
    API->>DB: SELECT FROM posts
    DB->>API: 要約付き投稿データ
    API->>App: 更新された投稿
    App->>User: AI要約を表示
```

## 10. ユーザー分析

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Worker as Edge Function
    participant DB as PostgreSQL
    participant Gemini as Gemini-2.5-Pro API

    User->>App: プロフィール → 分析を見る
    App->>API: GET /analysis
    
    API->>Worker: 分析生成リクエスト
    
    Worker->>DB: ユーザーアクティビティ集計
    note right of DB: - 投稿頻度・内容<br/>- 視聴傾向<br/>- コミュニティ参加度<br/>- エンゲージメント率
    DB->>Worker: アクティビティデータ
    
    Worker->>DB: インタラクション分析
    note right of DB: - フォロー/フォロワー比率<br/>- コメントの質<br/>- ハイライト理由の傾向
    DB->>Worker: インタラクションデータ
    
    Worker->>Worker: スコア計算
    note right of Worker: 目醒め度スコア:<br/>- 自己表現度<br/>- 共感力<br/>- 成長意欲<br/>- コミュニティ貢献度
    
    Worker->>Gemini: 分析レポート生成
    note right of Gemini: ユーザーデータから<br/>パーソナライズされた<br/>気づきとアドバイス生成
    
    Gemini->>Worker: 分析結果
    note right of Worker: {<br/>  awakenessLevel: 7.5,<br/>  insights: "分析文",<br/>  nextActions: ["アクション1", "アクション2"]<br/>}
    
    Worker->>API: 分析結果
    API->>App: 分析データ
    
    App->>User: 分析結果表示
    note right of User: 目醒め度: ⭐⭐⭐⭐☆<br/><br/>気づき:<br/>「音声投稿の共感度が高く...」<br/><br/>次のステップ:<br/>・ライブルームでの対話<br/>・瞑想系イベントへの参加
```

## エラーハンドリング

### AI API エラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Gemini as Gemini-2.5-Pro API

    User->>App: AIチャットメッセージ送信
    App->>API: POST /chat/sessions/{sessionId}/messages
    
    API->>Gemini: APIリクエスト
    
    alt レート制限エラー
        Gemini->>API: 429 Rate Limit Exceeded
        API->>App: 503 Service Temporarily Unavailable
        App->>User: 「しばらくお待ちください」
        App->>App: 30秒後にリトライ
    else APIエラー
        Gemini->>API: 500 Internal Server Error
        API->>API: フォールバックレスポンス
        API->>App: 簡易レスポンス
        App->>User: 「申し訳ございません。<br/>詳細な応答ができません」
    else タイムアウト
        Gemini--xAPI: Timeout (30s)
        API->>App: 408 Request Timeout
        App->>User: 「応答に時間がかかっています」
        App->>User: 再試行ボタン表示
    end
```

### 検索エラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 検索実行
    App->>API: GET /search?q={query}
    
    alt 検索クエリが複雑すぎる
        API->>DB: 全文検索実行
        DB->>API: Error: Query too complex
        API->>API: シンプルなLIKE検索にフォールバック
        API->>DB: SELECT ... WHERE text LIKE '%query%'
        DB->>API: 検索結果
        API->>App: 検索結果（精度低下の警告付き）
        App->>User: 結果表示 + 「より正確な検索のため<br/>キーワードを減らしてください」
    else インデックスエラー
        API->>DB: 全文検索実行
        DB->>API: Error: Index corrupted
        API->>API: エラーログ記録
        API->>App: 503 Service Unavailable
        App->>User: 「検索機能が一時的に<br/>利用できません」
    end
```
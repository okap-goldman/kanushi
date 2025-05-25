# 認証・アカウント管理シーケンス図

## 1. 新規登録（Google認証）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant Google as Google OAuth
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: アプリ起動
    App->>App: 認証状態確認
    App->>User: ログイン画面表示
    User->>App: Googleアカウント連携ボタンタップ
    App->>Google: 認証リクエスト
    Google->>User: Google認証画面表示
    User->>Google: 認証情報入力
    Google->>App: IDトークン返却
    App->>API: POST /auth/google (idToken)
    API->>API: IDトークン検証
    API->>DB: ユーザー存在確認
    DB->>API: 新規ユーザー
    API->>DB: INSERT INTO profiles
    DB->>API: プロフィールID
    API->>DB: INSERT INTO accounts
    DB->>API: アカウントID
    API->>App: JWT (accessToken, refreshToken)
    App->>App: トークン保存
    App->>User: オンボーディング画面表示
```

## 2. オンボーディングフロー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Storage as B2 Storage
    participant DB as PostgreSQL

    User->>App: 表示名入力
    App->>App: バリデーション
    User->>App: 次へ
    App->>App: 一時保存
    
    User->>App: 自己紹介文入力
    App->>App: 文字数カウント
    User->>App: 次へまたはスキップ
    App->>App: 一時保存
    
    User->>App: プロフィール画像選択
    App->>App: 画像リサイズ
    User->>App: 次へまたはスキップ
    
    User->>App: 自己紹介音声録音
    App->>App: 音声録音
    User->>App: 録音完了
    App->>App: 波形生成
    User->>App: 次へまたはスキップ
    
    User->>App: 外部リンク入力
    App->>App: URL検証
    User->>App: 完了ボタン
    
    App->>API: POST /uploads/presigned (profile_image)
    API->>App: presignedUrl
    App->>Storage: PUT プロフィール画像
    Storage->>App: 画像URL
    
    App->>API: POST /uploads/presigned (intro_audio)
    API->>App: presignedUrl
    App->>Storage: PUT 音声ファイル
    Storage->>App: 音声URL
    
    App->>API: PUT /users/me
    note right of API: displayName, profileText,<br/>profileImageUrl, introAudioUrl,<br/>externalLinkUrl
    API->>DB: UPDATE profiles
    DB->>API: 更新完了
    API->>App: ユーザー情報
    App->>User: ホーム画面へ遷移
```

## 3. ログイン（既存ユーザー）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant Google as Google OAuth
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: アプリ起動
    App->>App: 保存済みトークン確認
    alt トークンあり
        App->>API: GET /users/me
        API->>App: 401 Unauthorized (期限切れ)
    end
    
    App->>User: ログイン画面表示
    User->>App: Googleアカウント連携ボタンタップ
    App->>Google: 認証リクエスト
    Google->>App: IDトークン
    
    App->>API: POST /auth/google (idToken)
    API->>DB: ユーザー存在確認
    DB->>API: 既存ユーザー
    API->>DB: 最終ログイン時刻更新
    API->>App: JWT (accessToken, refreshToken)
    App->>App: トークン保存
    App->>User: ホーム画面表示
```

## 4. 複数アカウント管理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: プロフィール長押し
    App->>API: GET /accounts
    API->>DB: SELECT accounts WHERE profile_id
    DB->>API: アカウントリスト
    API->>App: アカウント一覧
    App->>User: アカウント選択画面表示
    
    alt アカウント追加
        User->>App: アカウント追加ボタン
        App->>App: 現在のアカウント数確認
        alt アカウント数 < 5
            App->>Google: 新規認証リクエスト
            note right of Google: 別のGoogleアカウントで認証
            Google->>App: IDトークン
            App->>API: POST /auth/google (idToken)
            API->>DB: 新規アカウント作成
            DB->>API: アカウントID
            API->>App: 新規JWT
            App->>App: アカウント情報保存
            App->>User: 新アカウントで画面更新
        else アカウント数 >= 5
            App->>User: エラー表示（上限到達）
        end
    else アカウント切替
        User->>App: 別アカウント選択
        App->>API: POST /accounts/{accountId}/switch
        API->>DB: アクティブ状態更新
        DB->>API: 更新完了
        API->>App: 新しいJWT
        App->>App: トークン更新
        App->>User: 選択アカウントで画面更新
    end
```

## 5. プロフィール編集

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant Storage as B2 Storage
    participant DB as PostgreSQL

    User->>App: プロフィール編集ボタン
    App->>API: GET /users/me
    API->>DB: SELECT FROM profiles
    DB->>API: 現在のプロフィール情報
    API->>App: プロフィールデータ
    App->>User: 編集画面表示
    
    User->>App: 表示名変更
    User->>App: 自己紹介文変更
    
    alt プロフィール画像変更
        User->>App: 新しい画像選択
        App->>API: POST /users/me/avatar
        API->>Storage: 画像アップロード
        Storage->>API: 新画像URL
        API->>DB: UPDATE profiles
        DB->>API: 更新完了
        API->>App: 新画像URL
    end
    
    alt 自己紹介音声変更
        User->>App: 音声録音
        App->>API: POST /users/me/intro-audio
        API->>Storage: 音声アップロード
        Storage->>API: 新音声URL
        API->>DB: UPDATE profiles
        DB->>API: 更新完了
        API->>App: 新音声URL
    end
    
    User->>App: 保存ボタン
    App->>API: PUT /users/me
    API->>DB: UPDATE profiles
    DB->>API: 更新完了
    API->>App: 更新後のプロフィール
    App->>User: プロフィール画面に戻る
```

## 6. パスキー認証（Email + Passkey）

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant WebAuthn as WebAuthn API
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: Email + Passkeyを選択
    User->>App: メールアドレス入力
    App->>API: POST /auth/passkey/register
    API->>API: チャレンジ生成
    API->>App: チャレンジ + オプション
    
    App->>WebAuthn: navigator.credentials.create()
    WebAuthn->>User: 生体認証プロンプト
    User->>WebAuthn: 生体認証実行
    WebAuthn->>App: 公開鍵クレデンシャル
    
    App->>API: POST /auth/passkey/verify
    API->>API: クレデンシャル検証
    API->>DB: パスキー情報保存
    DB->>API: 保存完了
    API->>App: JWT発行
    App->>User: ホーム画面表示
```

## 7. 通知設定管理

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant FCM as Firebase Cloud Messaging
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: 通知設定画面
    App->>API: GET /users/me/notification-settings
    API->>DB: SELECT FROM notification_settings
    DB->>API: 現在の設定
    API->>App: 通知設定データ
    App->>User: 設定画面表示
    
    User->>App: プッシュ通知ON/OFF切替
    alt プッシュ通知ON
        App->>App: OS通知許可確認
        App->>FCM: FCMトークン取得
        FCM->>App: FCMトークン
        App->>API: PUT /users/me/fcm-token
        API->>DB: UPDATE profiles SET fcm_token
        DB->>API: 更新完了
    else プッシュ通知OFF
        App->>API: PUT /users/me/fcm-token (null)
        API->>DB: UPDATE profiles SET fcm_token = NULL
        DB->>API: 更新完了
    end
    
    User->>App: 個別通知設定変更
    App->>API: PATCH /users/me/notification-settings
    note right of API: comment, highlight,<br/>follow, gift設定
    API->>DB: UPDATE notification_settings
    DB->>API: 更新完了
    API->>App: 更新確認
    App->>User: 設定保存完了表示
```

## 8. ログアウト

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API
    participant DB as PostgreSQL

    User->>App: ログアウトボタン
    App->>User: 確認ダイアログ表示
    User->>App: ログアウト確認
    
    App->>API: POST /auth/logout
    API->>DB: FCMトークン削除
    DB->>API: 削除完了
    API->>App: ログアウト完了
    
    App->>App: ローカルトークン削除
    App->>App: キャッシュクリア
    App->>App: アカウント情報削除
    App->>User: ログイン画面表示
```

## エラーハンドリング

### 認証エラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API

    User->>App: 操作実行
    App->>API: APIリクエスト
    
    alt トークン期限切れ
        API->>App: 401 Unauthorized
        App->>App: リフレッシュトークン確認
        App->>API: POST /auth/refresh
        API->>App: 新しいアクセストークン
        App->>API: 元のリクエスト再実行
        API->>App: 正常レスポンス
    else トークン無効
        API->>App: 401 Unauthorized
        App->>User: ログイン画面へリダイレクト
    else ネットワークエラー
        API--xApp: Network Error
        App->>User: オフラインモード表示
    end
```

### バリデーションエラー

```mermaid
sequenceDiagram
    participant User as ユーザー
    participant App as モバイルアプリ
    participant API as Supabase API

    User->>App: プロフィール情報入力
    App->>App: クライアントバリデーション
    
    alt バリデーションエラー
        App->>User: エラーメッセージ表示
        User->>App: 修正入力
    end
    
    App->>API: PUT /users/me
    alt サーバーバリデーションエラー
        API->>App: 400 Bad Request
        note right of API: {errors: [{field, message}]}
        App->>User: フィールドエラー表示
    else 成功
        API->>App: 200 OK
        App->>User: 成功メッセージ
    end
```
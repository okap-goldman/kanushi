# タイムラインドメイン API一覧

## 概要
タイムラインドメインのAPIエンドポイント一覧。認証を必要とするAPIには🔒マークがついています。

## API一覧

### タイムライン関連

#### タイムラインの取得
- **エンドポイント**: GET `/api/v1/timeline`
- **認証**: 🔒必須
- **説明**: ユーザーのタイムラインを取得する
- **クエリパラメータ**:
  - `type`: タイムラインタイプ（"family", "watch", または "all"、デフォルトは "family"）
  - `limit`: 取得する投稿数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "type": "family",
    "posts": [
      {
        "id": "投稿ID",
        "user_id": "ユーザーID",
        "content_type": "投稿タイプ",
        "text_content": "テキスト内容（プレビュー）",
        "media_url": "メディアURL",
        "thumbnail_url": "サムネイルURL",
        "created_at": "2023-05-01T12:00:00Z",
        "likes_count": 5,
        "comments_count": 3,
        "highlights_count": 2,
        "is_liked": false,
        "is_highlighted": false,
        "user": {
          "id": "ユーザーID",
          "name": "ユーザー名",
          "avatar_url": "アバターURL"
        },
        "tags": ["タグ1", "タグ2"]
      },
      /* 他の投稿 */
    ],
    "next_cursor": "次のページのカーソル",
    "refreshed_at": "2023-05-01T12:00:00Z"
  }
  ```

#### おすすめタイムラインの取得
- **エンドポイント**: GET `/api/v1/timeline/recommended`
- **認証**: 🔒必須
- **説明**: ユーザーに合わせたおすすめ投稿タイムラインを取得する
- **クエリパラメータ**:
  - `limit`: 取得する投稿数（デフォルト20、最大50）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "posts": [
      {
        /* 投稿の詳細情報（上記参照） */
        "recommendation_reason": {
          "type": "similar_interest|popular|followed_interaction",
          "description": "推薦理由の説明"
        }
      },
      /* 他の投稿 */
    ],
    "next_cursor": "次のページのカーソル",
    "refreshed_at": "2023-05-01T12:00:00Z"
  }
  ```

#### トレンドタイムラインの取得
- **エンドポイント**: GET `/api/v1/timeline/trending`
- **認証**: オプション
- **説明**: 現在トレンドの投稿タイムラインを取得する
- **クエリパラメータ**:
  - `category`: カテゴリーでフィルタリング（任意）
  - `limit`: 取得する投稿数（デフォルト20、最大50）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "posts": [
      {
        /* 投稿の詳細情報 */
        "trend_score": 95,
        "trend_category": "カテゴリー名"
      },
      /* 他の投稿 */
    ],
    "next_cursor": "次のページのカーソル",
    "refreshed_at": "2023-05-01T12:00:00Z"
  }
  ```

### タイムライン設定関連

#### タイムライン設定の取得
- **エンドポイント**: GET `/api/v1/timeline/settings`
- **認証**: 🔒必須
- **説明**: ユーザーのタイムライン設定を取得する
- **レスポンス**:
  ```json
  {
    "default_type": "family",
    "auto_play_media": true,
    "show_sensitive_content": false,
    "content_display_preferences": {
      "text": true,
      "image": true,
      "video": true,
      "audio": true
    },
    "updated_at": "2023-05-01T12:00:00Z"
  }
  ```

#### タイムライン設定の更新
- **エンドポイント**: PUT `/api/v1/timeline/settings`
- **認証**: 🔒必須
- **説明**: ユーザーのタイムライン設定を更新する
- **リクエストボディ**:
  ```json
  {
    "default_type": "watch",
    "auto_play_media": false,
    "show_sensitive_content": true,
    "content_display_preferences": {
      "text": true,
      "image": true,
      "video": false,
      "audio": true
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "default_type": "watch",
    "auto_play_media": false,
    "show_sensitive_content": true,
    "content_display_preferences": {
      "text": true,
      "image": true,
      "video": false,
      "audio": true
    },
    "updated_at": "2023-05-01T12:30:00Z"
  }
  ```

### 閲覧履歴関連

#### 閲覧履歴の記録
- **エンドポイント**: POST `/api/v1/timeline/view-history`
- **認証**: 🔒必須
- **説明**: 投稿の閲覧履歴を記録する
- **リクエストボディ**:
  ```json
  {
    "post_id": "閲覧した投稿ID",
    "view_duration": 30,
    "completed": true,
    "device_info": {
      "device_type": "mobile|desktop|tablet",
      "os": "iOS|Android|Windows|macOS",
      "app_version": "1.0.0"
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "閲覧履歴ID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "viewed_at": "2023-05-01T12:00:00Z",
    "view_duration": 30,
    "completed": true
  }
  ```

#### 閲覧履歴の取得
- **エンドポイント**: GET `/api/v1/timeline/view-history`
- **認証**: 🔒必須
- **説明**: ユーザー自身の閲覧履歴を取得する
- **クエリパラメータ**:
  - `limit`: 取得する履歴数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
  - `start_date`: フィルタリング開始日（YYYY-MM-DD）
  - `end_date`: フィルタリング終了日（YYYY-MM-DD）
- **レスポンス**:
  ```json
  {
    "history": [
      {
        "id": "閲覧履歴ID",
        "post_id": "投稿ID",
        "viewed_at": "2023-05-01T12:00:00Z",
        "view_duration": 30,
        "completed": true,
        "post": {
          /* 投稿の概要情報 */
        }
      },
      /* 他の閲覧履歴 */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

#### 閲覧履歴の削除
- **エンドポイント**: DELETE `/api/v1/timeline/view-history`
- **認証**: 🔒必須
- **説明**: ユーザーの閲覧履歴を削除する
- **クエリパラメータ**:
  - `post_id`: 特定の投稿の履歴のみ削除（任意）
  - `start_date`: 削除開始日（YYYY-MM-DD、任意）
  - `end_date`: 削除終了日（YYYY-MM-DD、任意）
  - `all`: すべての履歴を削除（true|false、デフォルトはfalse）
- **レスポンス**: HTTP 204 No Content

### フィードバック関連

#### 投稿のフィードバック送信
- **エンドポイント**: POST `/api/v1/timeline/feedback`
- **認証**: 🔒必須
- **説明**: タイムラインの投稿に対するフィードバックを送信する
- **リクエストボディ**:
  ```json
  {
    "post_id": "フィードバック対象の投稿ID",
    "feedback_type": "not_interested|hide|show_more|report",
    "reason": "フィードバック理由（任意）"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "フィードバックID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "feedback_type": "フィードバックタイプ",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

### フィルター設定関連

#### フィルター設定の取得
- **エンドポイント**: GET `/api/v1/timeline/filters`
- **認証**: 🔒必須
- **説明**: ユーザーのタイムラインフィルター設定を取得する
- **レスポンス**:
  ```json
  {
    "content_filters": {
      "text": true,
      "image": true,
      "video": true,
      "audio": true
    },
    "blocked_terms": ["ブロック単語1", "ブロック単語2"],
    "blocked_users": ["ユーザーID1", "ユーザーID2"],
    "content_preferences": {
      "topics": ["トピック1", "トピック2"],
      "languages": ["ja", "en"],
      "regions": ["JP", "US"]
    },
    "updated_at": "2023-05-01T12:00:00Z"
  }
  ```

#### フィルター設定の更新
- **エンドポイント**: PUT `/api/v1/timeline/filters`
- **認証**: 🔒必須
- **説明**: ユーザーのタイムラインフィルター設定を更新する
- **リクエストボディ**:
  ```json
  {
    "content_filters": {
      "text": true,
      "image": true,
      "video": false,
      "audio": true
    },
    "blocked_terms": ["新ブロック単語1", "新ブロック単語2"],
    "blocked_users": ["新ユーザーID1"],
    "content_preferences": {
      "topics": ["新トピック1", "新トピック2"],
      "languages": ["ja"],
      "regions": ["JP"]
    }
  }
  ```
- **レスポンス**:
  ```json
  {
    "content_filters": {
      "text": true,
      "image": true,
      "video": false,
      "audio": true
    },
    "blocked_terms": ["新ブロック単語1", "新ブロック単語2"],
    "blocked_users": ["新ユーザーID1"],
    "content_preferences": {
      "topics": ["新トピック1", "新トピック2"],
      "languages": ["ja"],
      "regions": ["JP"]
    },
    "updated_at": "2023-05-01T12:30:00Z"
  }
  ```

### おすすめ関連

#### おすすめコンテンツの取得
- **エンドポイント**: GET `/api/v1/recommendations`
- **認証**: 🔒必須
- **説明**: ユーザーへのおすすめコンテンツを取得する
- **クエリパラメータ**:
  - `type`: 推薦タイプ（"post", "event", "user", または "all"）
  - `limit`: 取得する推薦数（デフォルト20、最大50）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "recommendations": [
      {
        "id": "推薦ID",
        "type": "post",
        "target_id": "投稿ID",
        "score": 0.95,
        "reason": {
          "key": "similar_to_liked|popular|followed_interaction",
          "description": "推薦理由の説明"
        },
        "created_at": "2023-05-01T12:00:00Z",
        "target": {
          /* 推薦対象の詳細情報 */
        }
      },
      /* 他の推薦 */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

#### おすすめフィードバックの送信
- **エンドポイント**: POST `/api/v1/recommendations/{recommendation_id}/feedback`
- **認証**: 🔒必須
- **説明**: おすすめコンテンツに対するフィードバックを送信する
- **パスパラメータ**:
  - `recommendation_id`: 推薦ID
- **リクエストボディ**:
  ```json
  {
    "feedback_type": "relevant|not_relevant|show_more|show_less",
    "reason": "フィードバック理由（任意）"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "フィードバックID",
    "recommendation_id": "推薦ID",
    "user_id": "ユーザーID",
    "feedback_type": "フィードバックタイプ",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

## エラーレスポンス

すべてのAPIは、エラー発生時に以下の形式でレスポンスを返します。

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 一般的なエラーコード

| コード | HTTP ステータス | 説明 |
|-------|--------------|------|
| UNAUTHORIZED | 401 | 認証が必要です |
| FORBIDDEN | 403 | アクセス権限がありません |
| NOT_FOUND | 404 | リソースが見つかりません |
| VALIDATION_ERROR | 422 | リクエストパラメータが不正です |
| RATE_LIMIT_EXCEEDED | 429 | APIリクエスト制限を超えました |
| INTERNAL_SERVER_ERROR | 500 | サーバー内部エラーが発生しました |

### タイムライン固有のエラーコード

| コード | HTTP ステータス | 説明 |
|-------|--------------|------|
| TIMELINE_UNAVAILABLE | 503 | タイムラインサービスが一時的に利用できません |
| TIMELINE_GENERATION_FAILED | 500 | タイムライン生成に失敗しました |
| FILTER_INVALID | 422 | フィルター設定が不正です |

## APIリクエスト制限

- タイムライン取得: 毎分30リクエスト
- おすすめコンテンツ取得: 毎分20リクエスト
- 履歴・設定関連: 毎分50リクエスト

制限を超えると、HTTP 429 ステータスコードとともにエラーレスポンスが返されます。
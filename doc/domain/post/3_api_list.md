# 投稿ドメイン API一覧

## 概要
投稿ドメインのAPIエンドポイント一覧。認証を必要とするAPIには🔒マークがついています。

## API一覧

### 投稿関連

#### 投稿の作成
- **エンドポイント**: POST `/api/v1/posts`
- **認証**: 🔒必須
- **説明**: 新しい投稿を作成する
- **リクエストボディ**:
  ```json
  {
    "content_type": "text|image|video|audio",
    "text_content": "投稿内容のテキスト",
    "media_id": "添付メディアID（任意）",
    "event_id": "関連イベントID（任意）",
    "is_public": true,
    "tags": ["タグ1", "タグ2"]
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "投稿ID",
    "user_id": "ユーザーID",
    "content_type": "投稿タイプ",
    "text_content": "テキスト内容",
    "media_url": "メディアURL",
    "thumbnail_url": "サムネイルURL",
    "event_id": "イベントID",
    "is_public": true,
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z",
    "user": {
      "id": "ユーザーID",
      "name": "ユーザー名",
      "avatar_url": "アバターURL"
    },
    "tags": ["タグ1", "タグ2"]
  }
  ```

#### 投稿の取得
- **エンドポイント**: GET `/api/v1/posts/{post_id}`
- **認証**: オプション（非公開投稿の場合は必須）
- **説明**: IDで指定された投稿を取得する
- **パスパラメータ**:
  - `post_id`: 取得する投稿のID
- **レスポンス**:
  ```json
  {
    "id": "投稿ID",
    "user_id": "ユーザーID",
    "content_type": "投稿タイプ",
    "text_content": "テキスト内容",
    "media_url": "メディアURL",
    "thumbnail_url": "サムネイルURL",
    "event_id": "イベントID",
    "is_public": true,
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z",
    "user": {
      "id": "ユーザーID",
      "name": "ユーザー名",
      "avatar_url": "アバターURL"
    },
    "likes_count": 5,
    "comments_count": 3,
    "highlights_count": 2,
    "is_liked": false,
    "is_highlighted": false,
    "tags": ["タグ1", "タグ2"]
  }
  ```

#### 投稿の更新
- **エンドポイント**: PUT `/api/v1/posts/{post_id}`
- **認証**: 🔒必須（自分の投稿のみ更新可能）
- **説明**: 既存の投稿を更新する
- **パスパラメータ**:
  - `post_id`: 更新する投稿のID
- **リクエストボディ**:
  ```json
  {
    "text_content": "更新されたテキスト",
    "is_public": false,
    "tags": ["更新タグ1", "更新タグ2"]
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "投稿ID",
    "user_id": "ユーザーID",
    "content_type": "投稿タイプ",
    "text_content": "更新されたテキスト",
    "media_url": "メディアURL",
    "thumbnail_url": "サムネイルURL",
    "event_id": "イベントID",
    "is_public": false,
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:30:00Z",
    "user": {
      "id": "ユーザーID",
      "name": "ユーザー名",
      "avatar_url": "アバターURL"
    },
    "tags": ["更新タグ1", "更新タグ2"]
  }
  ```

#### 投稿の削除
- **エンドポイント**: DELETE `/api/v1/posts/{post_id}`
- **認証**: 🔒必須（自分の投稿のみ削除可能）
- **説明**: 投稿を削除する
- **パスパラメータ**:
  - `post_id`: 削除する投稿のID
- **レスポンス**: HTTP 204 No Content

#### ユーザーの投稿一覧取得
- **エンドポイント**: GET `/api/v1/users/{user_id}/posts`
- **認証**: オプション（非公開投稿の表示には必須）
- **説明**: 特定ユーザーの投稿一覧を取得する
- **パスパラメータ**:
  - `user_id`: ユーザーID
- **クエリパラメータ**:
  - `content_type`: フィルタリングする投稿タイプ（任意）
  - `limit`: 取得する投稿数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "posts": [
      {
        "id": "投稿ID",
        "user_id": "ユーザーID",
        "content_type": "投稿タイプ",
        "text_content": "テキスト内容",
        "media_url": "メディアURL",
        "thumbnail_url": "サムネイルURL",
        "created_at": "2023-05-01T12:00:00Z",
        "likes_count": 5,
        "comments_count": 3,
        "highlights_count": 2,
        "tags": ["タグ1", "タグ2"]
      },
      /* 他の投稿 */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

### コメント関連

#### コメントの作成
- **エンドポイント**: POST `/api/v1/posts/{post_id}/comments`
- **認証**: 🔒必須
- **説明**: 投稿にコメントを追加する
- **パスパラメータ**:
  - `post_id`: コメント対象の投稿ID
- **リクエストボディ**:
  ```json
  {
    "body": "コメント内容",
    "parent_comment_id": "親コメントID（返信の場合）"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "コメントID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "parent_comment_id": "親コメントID",
    "body": "コメント内容",
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:00:00Z",
    "user": {
      "id": "ユーザーID",
      "name": "ユーザー名",
      "avatar_url": "アバターURL"
    }
  }
  ```

#### コメント一覧取得
- **エンドポイント**: GET `/api/v1/posts/{post_id}/comments`
- **認証**: オプション
- **説明**: 投稿に対するコメント一覧を取得する
- **パスパラメータ**:
  - `post_id`: 投稿ID
- **クエリパラメータ**:
  - `parent_id`: 親コメントID（返信コメントをフィルタリング）
  - `limit`: 取得するコメント数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "comments": [
      {
        "id": "コメントID",
        "post_id": "投稿ID",
        "user_id": "ユーザーID",
        "parent_comment_id": "親コメントID",
        "body": "コメント内容",
        "created_at": "2023-05-01T12:00:00Z",
        "updated_at": "2023-05-01T12:00:00Z",
        "user": {
          "id": "ユーザーID",
          "name": "ユーザー名",
          "avatar_url": "アバターURL"
        },
        "reply_count": 2
      },
      /* 他のコメント */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

#### コメントの更新
- **エンドポイント**: PUT `/api/v1/comments/{comment_id}`
- **認証**: 🔒必須（自分のコメントのみ更新可能）
- **説明**: コメントを更新する
- **パスパラメータ**:
  - `comment_id`: 更新するコメントのID
- **リクエストボディ**:
  ```json
  {
    "body": "更新されたコメント内容"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "コメントID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "parent_comment_id": "親コメントID",
    "body": "更新されたコメント内容",
    "created_at": "2023-05-01T12:00:00Z",
    "updated_at": "2023-05-01T12:30:00Z",
    "user": {
      "id": "ユーザーID",
      "name": "ユーザー名",
      "avatar_url": "アバターURL"
    }
  }
  ```

#### コメントの削除
- **エンドポイント**: DELETE `/api/v1/comments/{comment_id}`
- **認証**: 🔒必須（自分のコメントのみ削除可能）
- **説明**: コメントを削除する
- **パスパラメータ**:
  - `comment_id`: 削除するコメントのID
- **レスポンス**: HTTP 204 No Content

### いいね関連

#### いいねの追加
- **エンドポイント**: POST `/api/v1/posts/{post_id}/likes`
- **認証**: 🔒必須
- **説明**: 投稿にいいねを追加する
- **パスパラメータ**:
  - `post_id`: いいねする投稿のID
- **レスポンス**:
  ```json
  {
    "id": "いいねID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

#### いいねの削除
- **エンドポイント**: DELETE `/api/v1/posts/{post_id}/likes`
- **認証**: 🔒必須
- **説明**: 投稿のいいねを取り消す
- **パスパラメータ**:
  - `post_id`: いいねを取り消す投稿のID
- **レスポンス**: HTTP 204 No Content

#### 投稿にいいねしたユーザー一覧
- **エンドポイント**: GET `/api/v1/posts/{post_id}/likes`
- **認証**: オプション
- **説明**: 投稿にいいねしたユーザー一覧を取得する
- **パスパラメータ**:
  - `post_id`: 投稿ID
- **クエリパラメータ**:
  - `limit`: 取得するユーザー数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "users": [
      {
        "id": "ユーザーID",
        "name": "ユーザー名",
        "avatar_url": "アバターURL",
        "liked_at": "2023-05-01T12:00:00Z"
      },
      /* 他のユーザー */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

### ハイライト関連

#### ハイライトの追加
- **エンドポイント**: POST `/api/v1/posts/{post_id}/highlights`
- **認証**: 🔒必須
- **説明**: 投稿をハイライトする
- **パスパラメータ**:
  - `post_id`: ハイライトする投稿のID
- **リクエストボディ**:
  ```json
  {
    "reason": "ハイライトする理由（任意）"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "ハイライトID",
    "post_id": "投稿ID",
    "user_id": "ユーザーID",
    "reason": "ハイライト理由",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

#### ハイライトの削除
- **エンドポイント**: DELETE `/api/v1/posts/{post_id}/highlights`
- **認証**: 🔒必須
- **説明**: 投稿のハイライトを取り消す
- **パスパラメータ**:
  - `post_id`: ハイライトを取り消す投稿のID
- **レスポンス**: HTTP 204 No Content

#### ハイライトした投稿一覧
- **エンドポイント**: GET `/api/v1/users/{user_id}/highlights`
- **認証**: オプション（ユーザー自身の場合は必須）
- **説明**: ユーザーがハイライトした投稿一覧を取得する
- **パスパラメータ**:
  - `user_id`: ユーザーID
- **クエリパラメータ**:
  - `limit`: 取得する投稿数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "highlights": [
      {
        "id": "ハイライトID",
        "post_id": "投稿ID",
        "user_id": "ユーザーID",
        "reason": "ハイライト理由",
        "created_at": "2023-05-01T12:00:00Z",
        "post": {
          /* 投稿の詳細情報 */
        }
      },
      /* 他のハイライト */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

### メディア関連

#### メディアのアップロード
- **エンドポイント**: POST `/api/v1/media`
- **認証**: 🔒必須
- **説明**: メディアファイルをアップロードする
- **リクエストボディ**: multipart/form-data
  - `file`: メディアファイル
  - `media_type`: "image", "video", または "audio"
- **レスポンス**:
  ```json
  {
    "id": "メディアID",
    "user_id": "ユーザーID",
    "media_type": "メディアタイプ",
    "url": "メディアURL",
    "thumbnail_url": "サムネイルURL（画像または動画の場合）",
    "metadata": {
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "duration": 30,
      "format": "mp4"
    },
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

#### メディア情報の取得
- **エンドポイント**: GET `/api/v1/media/{media_id}`
- **認証**: オプション
- **説明**: メディア情報を取得する
- **パスパラメータ**:
  - `media_id`: メディアID
- **レスポンス**:
  ```json
  {
    "id": "メディアID",
    "user_id": "ユーザーID",
    "media_type": "メディアタイプ",
    "url": "メディアURL",
    "thumbnail_url": "サムネイルURL",
    "metadata": {
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "duration": 30,
      "format": "mp4"
    },
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

#### メディアの削除
- **エンドポイント**: DELETE `/api/v1/media/{media_id}`
- **認証**: 🔒必須（自分のメディアのみ削除可能）
- **説明**: メディアを削除する（使用中のメディアは削除不可）
- **パスパラメータ**:
  - `media_id`: 削除するメディアのID
- **レスポンス**: HTTP 204 No Content

### タグ関連

#### タグの取得
- **エンドポイント**: GET `/api/v1/tags`
- **認証**: 不要
- **説明**: タグ一覧を取得する
- **クエリパラメータ**:
  - `query`: 検索クエリ
  - `limit`: 取得するタグ数（デフォルト20、最大100）
- **レスポンス**:
  ```json
  {
    "tags": [
      {
        "id": "タグID",
        "name": "タグ名",
        "usage_count": 150,
        "created_at": "2023-05-01T12:00:00Z"
      },
      /* 他のタグ */
    ]
  }
  ```

#### タグ付き投稿の取得
- **エンドポイント**: GET `/api/v1/tags/{tag_name}/posts`
- **認証**: オプション
- **説明**: 特定のタグが付いた投稿一覧を取得する
- **パスパラメータ**:
  - `tag_name`: タグ名
- **クエリパラメータ**:
  - `content_type`: フィルタリングする投稿タイプ（任意）
  - `limit`: 取得する投稿数（デフォルト20、最大100）
  - `cursor`: ページネーション用カーソル
- **レスポンス**:
  ```json
  {
    "posts": [
      {
        /* 投稿の詳細情報 */
      },
      /* 他の投稿 */
    ],
    "next_cursor": "次のページのカーソル"
  }
  ```

### 不適切コンテンツ報告

#### コンテンツの報告
- **エンドポイント**: POST `/api/v1/reports`
- **認証**: 🔒必須
- **説明**: 不適切なコンテンツを報告する
- **リクエストボディ**:
  ```json
  {
    "content_id": "報告対象のコンテンツID",
    "content_type": "post|comment",
    "reason": "inappropriate|spam|violence|copyright|other",
    "description": "詳細説明（任意）"
  }
  ```
- **レスポンス**:
  ```json
  {
    "id": "報告ID",
    "content_id": "コンテンツID",
    "content_type": "コンテンツタイプ",
    "reason": "報告理由",
    "status": "pending",
    "created_at": "2023-05-01T12:00:00Z"
  }
  ```

#### 報告ステータスの確認
- **エンドポイント**: GET `/api/v1/reports/{report_id}`
- **認証**: 🔒必須（自分の報告のみ閲覧可能）
- **説明**: 報告のステータスを確認する
- **パスパラメータ**:
  - `report_id`: 報告ID
- **レスポンス**:
  ```json
  {
    "id": "報告ID",
    "content_id": "コンテンツID",
    "content_type": "コンテンツタイプ",
    "reason": "報告理由",
    "description": "詳細説明",
    "status": "pending|reviewed|rejected|actioned",
    "created_at": "2023-05-01T12:00:00Z",
    "reviewed_at": "2023-05-02T10:00:00Z"
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

## APIリクエスト制限

- 認証済みユーザー: 毎分100リクエスト
- 未認証ユーザー: 毎分20リクエスト
- メディアアップロード: 毎時20リクエスト

制限を超えると、HTTP 429 ステータスコードとともにエラーレスポンスが返されます。
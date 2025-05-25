# 分析ドメインAPI一覧

## ユーザー分析API

### GET /analysis
ユーザーの活動データに基づく分析結果を取得します。

**レスポンス**
```json
{
  "awakenessLevel": 75,
  "awakenessReasons": [
    "コンテンツ投稿の質が向上しています",
    "ハイライト登録が増加しています",
    "コミュニティ活動への参加が活発です"
  ],
  "insights": [
    "自己探求に関する投稿が増えています",
    "コミュニティへの貢献が目立ちます",
    "瞑想に関する関心が高まっています"
  ],
  "nextActions": [
    {
      "type": "event_participation",
      "title": "「内観と自己理解」イベントへの参加",
      "description": "あなたの関心と合致するイベントです",
      "linkUrl": "/events/123"
    },
    {
      "type": "content_creation",
      "title": "瞑想実践記録の共有",
      "description": "周囲の方々にもポジティブな影響を与えられます",
      "linkUrl": null
    }
  ],
  "trendChart": {
    "labels": ["1週間前", "6日前", "5日前", "4日前", "3日前", "2日前", "昨日"],
    "data": [65, 68, 70, 72, 71, 74, 75]
  }
}
```

### GET /analysis/history
ユーザーの目醒め度履歴を取得します。

**クエリパラメータ**
- `period`: 期間（week | month | year、デフォルトはmonth）

**レスポンス**
```json
{
  "history": [
    {
      "date": "2023-05-01",
      "awakenessLevel": 65,
      "significantEvents": [
        {
          "type": "post_creation",
          "description": "瞑想についての投稿を作成"
        }
      ]
    },
    {
      "date": "2023-05-15",
      "awakenessLevel": 72,
      "significantEvents": [
        {
          "type": "event_participation",
          "description": "「内観」イベントに参加"
        }
      ]
    }
  ]
}
```

### POST /analysis/feedback
分析結果に対するフィードバックを送信します。

**リクエスト**
```json
{
  "insightId": "uuid",
  "isHelpful": true,
  "comment": "この洞察は非常に役立ちました"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "フィードバックありがとうございます"
}
```

## コンテンツ閲覧記録API

### POST /analysis/content-views
コンテンツ閲覧記録を追加します。

**リクエスト**
```json
{
  "contentId": "uuid",
  "contentType": "post",
  "viewDuration": 120,
  "completionPercentage": 100
}
```

**レスポンス**
```json
{
  "id": "uuid",
  "contentId": "uuid",
  "contentType": "post",
  "viewDuration": 120,
  "createdAt": "datetime"
}
```

### GET /analysis/content-views
自分のコンテンツ閲覧履歴を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル
- `contentType`: コンテンツタイプでフィルタリング（任意）

**レスポンス**
```json
{
  "views": [
    {
      "id": "uuid",
      "content": {
        "id": "uuid",
        "type": "post",
        "title": "瞑想の効果について",
        "thumbnailUrl": "string"
      },
      "viewDuration": 120,
      "createdAt": "datetime"
    }
  ],
  "nextCursor": "string"
}
```

## 検索履歴API

### GET /analysis/search-history
自分の検索履歴を取得します。

**クエリパラメータ**
- `limit`: 取得数の上限（デフォルト20、最大100）
- `cursor`: ページネーション用カーソル

**レスポンス**
```json
{
  "searches": [
    {
      "id": "uuid",
      "query": "瞑想 効果",
      "searchedAt": "datetime"
    }
  ],
  "nextCursor": "string"
}
```

### DELETE /analysis/search-history/:id
指定された検索履歴を削除します。

**レスポンス**
```json
{
  "success": true
}
```

### DELETE /analysis/search-history
すべての検索履歴を削除します。

**レスポンス**
```json
{
  "success": true,
  "deletedCount": 15
}
```

## データ管理設定API

### GET /analysis/settings
分析データの収集と利用に関する設定を取得します。

**レスポンス**
```json
{
  "dataCollection": {
    "contentViews": true,
    "searchHistory": true,
    "activityAnalysis": true
  },
  "dataRetention": {
    "contentViews": "6months",
    "searchHistory": "3months",
    "activityLogs": "1year"
  }
}
```

### PUT /analysis/settings
分析データの収集と利用に関する設定を更新します。

**リクエスト**
```json
{
  "dataCollection": {
    "contentViews": true,
    "searchHistory": false,
    "activityAnalysis": true
  },
  "dataRetention": {
    "contentViews": "1month",
    "searchHistory": "none",
    "activityLogs": "6months"
  }
}
```

**レスポンス**
```json
{
  "success": true,
  "appliedAt": "datetime"
}
```

### POST /analysis/data-export
ユーザーの分析データのエクスポートをリクエストします。

**リクエスト**
```json
{
  "dataTypes": ["contentViews", "searchHistory", "activityLogs"],
  "format": "json"
}
```

**レスポンス**
```json
{
  "requestId": "uuid",
  "estimatedCompletionTime": "datetime",
  "status": "processing"
}
```
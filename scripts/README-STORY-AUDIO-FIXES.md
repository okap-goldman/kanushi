# ストーリーズの音声フィールド対応について

## 実施した修正内容

新しく追加されたストーリーズテーブルの `audioUrl` と `audioTranscript` フィールドに対応するため、以下のシーディングファイルを修正しました。

### 修正されたファイル

1. **`scripts/seed-with-drizzle.ts`**
   - `mockStories` 配列に `audioUrl` と `audioTranscript` フィールドを追加
   - `seedStories()` 関数でこれらのフィールドを処理するように修正

2. **`supabase/migrations/014_seed_japanese_mock_data_current_schema.sql`**
   - 一部修正済み（最初の数エントリ）

3. **`supabase/migrations/014_seed_japanese_mock_data_current_schema_fixed.sql`** 
   - 完全に新しいスキーマに対応した新しいSQLファイル
   - すべてのストーリーエントリに `audio_url` と `audio_transcript` フィールドを含む

### 追加されたフィールドの内容

- **`audio_url`**: 音声ファイルのURL（Backblaze B2ストレージ）
- **`audio_transcript`**: 音声の文字起こしテキスト（日本語のスピリチュアル系コンテンツ）

### ファイルの状況

#### ✅ 既に対応済み
- `src/lib/mockData/stories.ts` - モックデータファイルは既に新しいフィールドに対応済み

#### ✅ 修正完了  
- `scripts/seed-with-drizzle.ts` - Drizzle ORMでのシーディング
- `supabase/migrations/014_seed_japanese_mock_data_current_schema_fixed.sql` - 新しいSQLマイグレーション

## 使用方法

### Drizzle ORMでのシーディング
```bash
npm run db:seed-drizzle
```

### SQLファイルでのシーディング（推奨）
```bash
# 新しい修正版を使用
psql "$DATABASE_URL" -f supabase/migrations/014_seed_japanese_mock_data_current_schema_fixed.sql
```

## 注意事項

- 新しいストーリーズスキーマでは `audio_url` と `audio_transcript` が必須フィールドです
- 既存のストーリーデータがある場合は、これらのフィールドがNULLになってエラーが発生する可能性があります
- データベースのリセットとシーディングを行う場合は `npm run db:reset-and-setup` を実行してください

## 確認方法

シーディング後、以下のクエリでデータが正しく投入されているか確認できます：

```sql
SELECT 
  id, 
  user_id, 
  image_url, 
  audio_url, 
  audio_transcript, 
  created_at 
FROM story 
ORDER BY created_at DESC 
LIMIT 5;
```
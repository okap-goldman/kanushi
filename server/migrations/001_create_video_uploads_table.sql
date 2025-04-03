-- VIDEO_UPLOADSテーブルの作成
CREATE TABLE IF NOT EXISTS "VIDEO_UPLOADS" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL,
  "filename" TEXT NOT NULL,
  "filesize" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "youtube_url" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "updated_at" TIMESTAMP WITH TIME ZONE
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS "idx_video_uploads_user_id" ON "VIDEO_UPLOADS" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_video_uploads_status" ON "VIDEO_UPLOADS" ("status");

-- コメント
COMMENT ON TABLE "VIDEO_UPLOADS" IS '動画アップロードの進捗管理とステータス追跡のためのテーブル';
COMMENT ON COLUMN "VIDEO_UPLOADS"."id" IS 'アップロードの一意識別子';
COMMENT ON COLUMN "VIDEO_UPLOADS"."user_id" IS 'アップロードを行ったユーザーのID';
COMMENT ON COLUMN "VIDEO_UPLOADS"."filename" IS 'アップロードされたファイルの元のファイル名';
COMMENT ON COLUMN "VIDEO_UPLOADS"."filesize" IS 'ファイルサイズ（バイト単位）';
COMMENT ON COLUMN "VIDEO_UPLOADS"."status" IS 'アップロード状態（processing, completed, error）';
COMMENT ON COLUMN "VIDEO_UPLOADS"."youtube_url" IS 'アップロード完了後のYouTube URL';
COMMENT ON COLUMN "VIDEO_UPLOADS"."created_at" IS 'アップロード開始日時';
COMMENT ON COLUMN "VIDEO_UPLOADS"."updated_at" IS 'ステータス更新日時'; 
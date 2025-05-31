DO $$ BEGIN
 CREATE TYPE "public"."cart_status" AS ENUM('active', 'checked_out');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."content_type" AS ENUM('text', 'image', 'audio', 'video');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_participant_status" AS ENUM('registered', 'attended', 'cancelled', 'no_show');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."event_type" AS ENUM('online', 'offline', 'hybrid', 'voice_workshop');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."follow_status" AS ENUM('active', 'unfollowed', 'blocked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."follow_type" AS ENUM('family', 'watch');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."group_role" AS ENUM('owner', 'admin', 'moderator', 'member');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."group_type" AS ENUM('public', 'private', 'subscription');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."member_status" AS ENUM('active', 'pending', 'blocked', 'left');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'audio', 'video', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."notification_type" AS ENUM('follow', 'like', 'comment', 'mention', 'dm', 'event_reminder', 'event_update', 'gift_received', 'order_update', 'group_invite', 'system');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."participant_role" AS ENUM('host', 'speaker', 'listener', 'moderator');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."playlist_type" AS ENUM('daily', 'mood', 'activity', 'personalized');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."product_type" AS ENUM('digital', 'physical', 'service');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."room_status" AS ENUM('scheduled', 'live', 'ended', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."vote_type" AS ENUM('available', 'maybe', 'unavailable');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."account_type" AS ENUM('google', 'apple', 'passkey');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."speaker_request_status" AS ENUM('pending', 'approved', 'rejected');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"account_type" "account_type" NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"switch_order" integer NOT NULL,
	"last_switched_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_profile_id_switch_order_unique" UNIQUE("profile_id","switch_order"),
	CONSTRAINT "account_profile_id_account_type_unique" UNIQUE("profile_id","account_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "follow" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"followee_id" uuid NOT NULL,
	"follow_type" "follow_type" NOT NULL,
	"status" "follow_status" NOT NULL,
	"follow_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"unfollowed_at" timestamp with time zone,
	"unfollow_reason" text,
	CONSTRAINT "follow_follower_id_followee_id_unique" UNIQUE("follower_id","followee_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "passkey" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"credential_id" text NOT NULL,
	"public_key" text NOT NULL,
	"counter" integer DEFAULT 0 NOT NULL,
	"device_name" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "passkey_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profile" (
	"id" uuid PRIMARY KEY NOT NULL,
	"google_uid" text,
	"apple_uid" text,
	"display_name" text NOT NULL,
	"profile_text" text,
	"profile_image_url" text,
	"intro_audio_url" text,
	"external_link_url" text,
	"prefecture" text,
	"city" text,
	"fcm_token" text,
	"public_key" text,
	"key_generated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_google_uid_unique" UNIQUE("google_uid"),
	CONSTRAINT "profile_apple_uid_unique" UNIQUE("apple_uid")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookmark" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookmark_post_id_user_id_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hashtag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hashtag_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "highlight" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "highlight_post_id_user_id_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "like" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "like_post_id_user_id_unique" UNIQUE("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "offline_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"size_bytes" integer NOT NULL,
	"cached_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	CONSTRAINT "offline_content_user_id_post_id_unique" UNIQUE("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post_hashtag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"hashtag_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_hashtag_post_id_hashtag_id_unique" UNIQUE("post_id","hashtag_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content_type" "content_type" NOT NULL,
	"text_content" text,
	"media_url" text,
	"preview_url" text,
	"waveform_url" text,
	"duration_seconds" integer,
	"youtube_video_id" text,
	"event_id" uuid,
	"group_id" uuid,
	"ai_metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"image_url" text NOT NULL,
	"audio_url" text NOT NULL,
	"audio_transcript" text,
	"text_content" text,
	"background_color" text,
	"font_style" text,
	"edit_data" jsonb,
	"caption" text,
	"location" text,
	"is_repost" boolean DEFAULT false NOT NULL,
	"original_story_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_reaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"emoji" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_reaction_story_id_user_id_unique" UNIQUE("story_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_reply" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"reply_text" text NOT NULL,
	"message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "story_viewer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"story_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "story_viewer_story_id_user_id_unique" UNIQUE("story_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "direct_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"message_type" "message_type" NOT NULL,
	"text_content" text,
	"media_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_encrypted" boolean DEFAULT false NOT NULL,
	"encrypted_key" text,
	"encryption_iv" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dm_thread" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user1_id" uuid NOT NULL,
	"user2_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dm_thread_user1_id_user2_id_unique" UNIQUE("user1_id","user2_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gift" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"post_id" uuid,
	"room_id" uuid,
	"amount" integer NOT NULL,
	"platform_fee_rate" numeric(5, 4) DEFAULT '0.3' NOT NULL,
	"stores_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "live_room" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "room_status" NOT NULL,
	"livekit_room_name" text,
	"max_speakers" integer DEFAULT 8 NOT NULL,
	"is_recording" boolean DEFAULT false NOT NULL,
	"post_id" uuid,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "live_room_livekit_room_name_unique" UNIQUE("livekit_room_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"shared_url" text,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "room_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "participant_role" NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "room_participant_room_id_user_id_unique" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "speaker_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "speaker_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "speaker_request_room_id_user_id_unique" UNIQUE("room_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_archive_access" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "event_archive_access_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_participant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "event_participant_status" NOT NULL,
	"payment_status" "payment_status",
	"stores_payment_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_participant_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_voice_workshop" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"max_participants" integer DEFAULT 10 NOT NULL,
	"is_recorded" boolean DEFAULT false NOT NULL,
	"recording_url" text,
	"archive_expires_at" timestamp with time zone,
	CONSTRAINT "event_voice_workshop_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"event_type" "event_type" NOT NULL,
	"location" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"fee" numeric(10, 2),
	"currency" text DEFAULT 'JPY',
	"refund_policy" text,
	"live_room_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cart_item_cart_id_product_id_unique" UNIQUE("cart_id","product_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "cart" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"status" "cart_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_user_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"stores_payment_id" text,
	"status" "order_status" NOT NULL,
	"shipping_info" jsonb,
	"tracking_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"product_type" "product_type" NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'JPY' NOT NULL,
	"image_url" text,
	"preview_url" text,
	"preview_duration" integer,
	"stock" integer,
	"source_post_id" uuid,
	"ai_description" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"message_type" "message_type" NOT NULL,
	"text_content" text,
	"media_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "group_role" NOT NULL,
	"status" "member_status" NOT NULL,
	"stores_subscription_id" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"left_at" timestamp with time zone,
	CONSTRAINT "group_member_group_id_user_id_unique" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"group_type" "group_type" NOT NULL,
	"subscription_price" numeric(10, 2),
	"stores_price_id" text,
	"member_limit" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_playlist_post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"playlist_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	CONSTRAINT "ai_playlist_post_playlist_id_post_id_unique" UNIQUE("playlist_id","post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_playlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"playlist_type" "playlist_type" NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone DEFAULT '2025-06-06T19:32:50.869Z' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"function_calls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "search_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"query" text NOT NULL,
	"searched_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification_setting" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_setting_user_id_notification_type_unique" UNIQUE("user_id","notification_type")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"notification_type" "notification_type" NOT NULL,
	"data" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_candidate" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"candidate_datetime" timestamp with time zone NOT NULL,
	"order_index" integer NOT NULL,
	CONSTRAINT "schedule_candidate_poll_id_order_index_unique" UNIQUE("poll_id","order_index")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_poll" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"related_event_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_vote" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"vote_type" "vote_type" NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedule_vote_candidate_id_user_id_unique" UNIQUE("candidate_id","user_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow" ADD CONSTRAINT "follow_follower_id_profile_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "follow" ADD CONSTRAINT "follow_followee_id_profile_id_fk" FOREIGN KEY ("followee_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "passkey" ADD CONSTRAINT "passkey_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookmark" ADD CONSTRAINT "bookmark_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comment" ADD CONSTRAINT "comment_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "highlight" ADD CONSTRAINT "highlight_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "highlight" ADD CONSTRAINT "highlight_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "like" ADD CONSTRAINT "like_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "like" ADD CONSTRAINT "like_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offline_content" ADD CONSTRAINT "offline_content_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "offline_content" ADD CONSTRAINT "offline_content_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_hashtag" ADD CONSTRAINT "post_hashtag_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_hashtag" ADD CONSTRAINT "post_hashtag_hashtag_id_hashtag_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."hashtag"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post" ADD CONSTRAINT "post_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story" ADD CONSTRAINT "story_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story" ADD CONSTRAINT "story_original_story_id_story_id_fk" FOREIGN KEY ("original_story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_reaction" ADD CONSTRAINT "story_reaction_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_reaction" ADD CONSTRAINT "story_reaction_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_reply" ADD CONSTRAINT "story_reply_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_reply" ADD CONSTRAINT "story_reply_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_viewer" ADD CONSTRAINT "story_viewer_story_id_story_id_fk" FOREIGN KEY ("story_id") REFERENCES "public"."story"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "story_viewer" ADD CONSTRAINT "story_viewer_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_thread_id_dm_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."dm_thread"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "direct_message" ADD CONSTRAINT "direct_message_sender_id_profile_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dm_thread" ADD CONSTRAINT "dm_thread_user1_id_profile_id_fk" FOREIGN KEY ("user1_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dm_thread" ADD CONSTRAINT "dm_thread_user2_id_profile_id_fk" FOREIGN KEY ("user2_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift" ADD CONSTRAINT "gift_sender_id_profile_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift" ADD CONSTRAINT "gift_recipient_id_profile_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift" ADD CONSTRAINT "gift_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gift" ADD CONSTRAINT "gift_room_id_live_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."live_room"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_room" ADD CONSTRAINT "live_room_host_user_id_profile_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "live_room" ADD CONSTRAINT "live_room_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_chat" ADD CONSTRAINT "room_chat_room_id_live_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."live_room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_chat" ADD CONSTRAINT "room_chat_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_participant" ADD CONSTRAINT "room_participant_room_id_live_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."live_room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "room_participant" ADD CONSTRAINT "room_participant_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "speaker_request" ADD CONSTRAINT "speaker_request_room_id_live_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."live_room"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "speaker_request" ADD CONSTRAINT "speaker_request_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_archive_access" ADD CONSTRAINT "event_archive_access_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_archive_access" ADD CONSTRAINT "event_archive_access_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_participant" ADD CONSTRAINT "event_participant_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_voice_workshop" ADD CONSTRAINT "event_voice_workshop_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_creator_user_id_profile_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event" ADD CONSTRAINT "event_live_room_id_live_room_id_fk" FOREIGN KEY ("live_room_id") REFERENCES "public"."live_room"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_cart_id_cart_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."cart"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart_item" ADD CONSTRAINT "cart_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "cart" ADD CONSTRAINT "cart_buyer_user_id_profile_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_item" ADD CONSTRAINT "order_item_order_id_order_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."order"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_item" ADD CONSTRAINT "order_item_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order" ADD CONSTRAINT "order_buyer_user_id_profile_id_fk" FOREIGN KEY ("buyer_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product" ADD CONSTRAINT "product_seller_user_id_profile_id_fk" FOREIGN KEY ("seller_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "product" ADD CONSTRAINT "product_source_post_id_post_id_fk" FOREIGN KEY ("source_post_id") REFERENCES "public"."post"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_chat" ADD CONSTRAINT "group_chat_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_chat" ADD CONSTRAINT "group_chat_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_member" ADD CONSTRAINT "group_member_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group_member" ADD CONSTRAINT "group_member_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "group" ADD CONSTRAINT "group_owner_user_id_profile_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_playlist_post" ADD CONSTRAINT "ai_playlist_post_playlist_id_ai_playlist_id_fk" FOREIGN KEY ("playlist_id") REFERENCES "public"."ai_playlist"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_playlist_post" ADD CONSTRAINT "ai_playlist_post_post_id_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."post"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_playlist" ADD CONSTRAINT "ai_playlist_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_session_id_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."chat_session"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_message" ADD CONSTRAINT "chat_message_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "chat_session" ADD CONSTRAINT "chat_session_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification_setting" ADD CONSTRAINT "notification_setting_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_candidate" ADD CONSTRAINT "schedule_candidate_poll_id_schedule_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."schedule_poll"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_poll" ADD CONSTRAINT "schedule_poll_creator_user_id_profile_id_fk" FOREIGN KEY ("creator_user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_poll" ADD CONSTRAINT "schedule_poll_related_event_id_event_id_fk" FOREIGN KEY ("related_event_id") REFERENCES "public"."event"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_vote" ADD CONSTRAINT "schedule_vote_poll_id_schedule_poll_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."schedule_poll"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_vote" ADD CONSTRAINT "schedule_vote_candidate_id_schedule_candidate_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."schedule_candidate"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_vote" ADD CONSTRAINT "schedule_vote_user_id_profile_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_profile_id" ON "account" USING btree (profile_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_is_active" ON "account" USING btree (is_active);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_account_type" ON "account" USING btree (account_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_follow_follower_id" ON "follow" USING btree (follower_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_follow_followee_id" ON "follow" USING btree (followee_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_follow_status" ON "follow" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_follow_created_at" ON "follow" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_passkey_profile_id" ON "passkey" USING btree (profile_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_passkey_credential_id" ON "passkey" USING btree (credential_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profile_google_uid" ON "profile" USING btree (google_uid);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profile_apple_uid" ON "profile" USING btree (apple_uid);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profile_location" ON "profile" USING btree (prefecture,city);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookmark_post_id" ON "bookmark" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_bookmark_user_id" ON "bookmark" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comment_post_id" ON "comment" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comment_user_id" ON "comment" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comment_created_at" ON "comment" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hashtag_name" ON "hashtag" USING btree (name);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_hashtag_use_count" ON "hashtag" USING btree (use_count DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_highlight_post_id" ON "highlight" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_highlight_user_id" ON "highlight" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_like_post_id" ON "like" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_like_user_id" ON "like" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_content_user_id" ON "offline_content" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_offline_content_expires_at" ON "offline_content" USING btree (expires_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_hashtag_post_id" ON "post_hashtag" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_hashtag_hashtag_id" ON "post_hashtag" USING btree (hashtag_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_user_id" ON "post" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_content_type" ON "post" USING btree (content_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_created_at" ON "post" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_deleted_at" ON "post" USING btree (deleted_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_event_id" ON "post" USING btree (event_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_post_group_id" ON "post" USING btree (group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_user_id" ON "story" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_expires_at" ON "story" USING btree (expires_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_created_at" ON "story" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_reaction_story_id" ON "story_reaction" USING btree (story_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_reaction_user_id" ON "story_reaction" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_reply_story_id" ON "story_reply" USING btree (story_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_reply_user_id" ON "story_reply" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_viewer_story_id" ON "story_viewer" USING btree (story_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_story_viewer_user_id" ON "story_viewer" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_direct_message_thread_id" ON "direct_message" USING btree (thread_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_direct_message_sender_id" ON "direct_message" USING btree (sender_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_direct_message_created_at" ON "direct_message" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_direct_message_is_read" ON "direct_message" USING btree (is_read);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dm_thread_user1_id" ON "dm_thread" USING btree (user1_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dm_thread_user2_id" ON "dm_thread" USING btree (user2_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dm_thread_created_at" ON "dm_thread" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_sender_id" ON "gift" USING btree (sender_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_recipient_id" ON "gift" USING btree (recipient_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_post_id" ON "gift" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_room_id" ON "gift" USING btree (room_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gift_created_at" ON "gift" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_room_host_user_id" ON "live_room" USING btree (host_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_room_status" ON "live_room" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_room_started_at" ON "live_room" USING btree (started_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_live_room_created_at" ON "live_room" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_chat_room_id" ON "room_chat" USING btree (room_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_chat_user_id" ON "room_chat" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_chat_created_at" ON "room_chat" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_chat_is_pinned" ON "room_chat" USING btree (is_pinned);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_participant_room_id" ON "room_participant" USING btree (room_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_participant_user_id" ON "room_participant" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_room_participant_role" ON "room_participant" USING btree (role);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_speaker_request_room_id" ON "speaker_request" USING btree (room_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_speaker_request_user_id" ON "speaker_request" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_speaker_request_status" ON "speaker_request" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_archive_access_event_id" ON "event_archive_access" USING btree (event_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_archive_access_user_id" ON "event_archive_access" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_participant_event_id" ON "event_participant" USING btree (event_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_participant_user_id" ON "event_participant" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_participant_status" ON "event_participant" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_participant_payment_status" ON "event_participant" USING btree (payment_status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_voice_workshop_event_id" ON "event_voice_workshop" USING btree (event_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_creator_user_id" ON "event" USING btree (creator_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_event_type" ON "event" USING btree (event_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_starts_at" ON "event" USING btree (starts_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_ends_at" ON "event" USING btree (ends_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_event_created_at" ON "event" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cart_item_cart_id" ON "cart_item" USING btree (cart_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cart_item_product_id" ON "cart_item" USING btree (product_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cart_buyer_user_id" ON "cart" USING btree (buyer_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cart_status" ON "cart" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_cart_updated_at" ON "cart" USING btree (updated_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_item_order_id" ON "order_item" USING btree (order_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_item_product_id" ON "order_item" USING btree (product_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_buyer_user_id" ON "order" USING btree (buyer_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_status" ON "order" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_created_at" ON "order" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_seller_user_id" ON "product" USING btree (seller_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_product_type" ON "product" USING btree (product_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_price" ON "product" USING btree (price);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_created_at" ON "product" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_source_post_id" ON "product" USING btree (source_post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_chat_group_id" ON "group_chat" USING btree (group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_chat_user_id" ON "group_chat" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_chat_created_at" ON "group_chat" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_member_group_id" ON "group_member" USING btree (group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_member_user_id" ON "group_member" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_member_role" ON "group_member" USING btree (role);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_member_status" ON "group_member" USING btree (status);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_owner_user_id" ON "group" USING btree (owner_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_group_type" ON "group" USING btree (group_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_group_created_at" ON "group" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_post_playlist_id" ON "ai_playlist_post" USING btree (playlist_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_post_post_id" ON "ai_playlist_post" USING btree (post_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_user_id" ON "ai_playlist" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_playlist_type" ON "ai_playlist" USING btree (playlist_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_generated_at" ON "ai_playlist" USING btree (generated_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ai_playlist_expires_at" ON "ai_playlist" USING btree (expires_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_message_session_id" ON "chat_message" USING btree (session_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_message_user_id" ON "chat_message" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_message_created_at" ON "chat_message" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_session_user_id" ON "chat_session" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chat_session_created_at" ON "chat_session" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_history_user_id" ON "search_history" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_history_searched_at" ON "search_history" USING btree (searched_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_search_history_query" ON "search_history" USING btree (query);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_setting_user_id" ON "notification_setting" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_user_id" ON "notification" USING btree (user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_notification_type" ON "notification" USING btree (notification_type);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_is_read" ON "notification" USING btree (is_read);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notification_created_at" ON "notification" USING btree (created_at DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_candidate_poll_id" ON "schedule_candidate" USING btree (poll_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_poll_creator_user_id" ON "schedule_poll" USING btree (creator_user_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_poll_related_event_id" ON "schedule_poll" USING btree (related_event_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_poll_deadline_at" ON "schedule_poll" USING btree (deadline_at);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_vote_poll_id" ON "schedule_vote" USING btree (poll_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_vote_candidate_id" ON "schedule_vote" USING btree (candidate_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_schedule_vote_user_id" ON "schedule_vote" USING btree (user_id);
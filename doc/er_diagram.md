```mermaid
erDiagram
    PROFILE {
        UUID id PK "プロフィールID (auth.users参照)"
        string google_uid
        string apple_uid
        string display_name
        text   profile_text
        string profile_image_url
        string intro_audio_url
        string external_link_url
        string prefecture
        string city
        string fcm_token
        datetime created_at
        datetime updated_at
    }

    ACCOUNT {
        UUID id PK
        UUID profile_id FK "プロフィールID"
        boolean is_active
        integer switch_order "1-5の範囲"
        datetime last_switched_at
        datetime created_at
        UNIQUE(profile_id, switch_order)
        CHECK(switch_order BETWEEN 1 AND 5)
    }

    FOLLOW {
        UUID id PK
        UUID follower_id FK
        UUID followee_id FK
        enum follow_type
        enum status
        text follow_reason
        datetime created_at
        datetime unfollowed_at
        text unfollow_reason
    }

    POST {
        UUID id PK
        UUID user_id FK
        enum content_type
        text text_content
        string media_url
        string preview_url
        string waveform_url
        integer duration_seconds
        string youtube_video_id "将来の拡張用（現在未使用）"
        UUID event_id FK
        UUID group_id FK
        jsonb ai_metadata "音声要約、推奨視聴者タグ等"
        datetime created_at
        datetime updated_at
        datetime deleted_at
    }

    STORY {
        UUID id PK
        UUID user_id FK
        string image_url
        jsonb edit_data
        boolean is_repost
        UUID original_story_id FK
        datetime expires_at
        datetime created_at
    }

    HASHTAG {
        UUID id PK
        string name "UNIQUE"
        integer use_count
        datetime created_at
    }

    POST_HASHTAG {
        UUID id PK
        UUID post_id FK
        UUID hashtag_id FK
        datetime created_at
    }

    COMMENT {
        UUID id PK
        UUID post_id FK
        UUID user_id FK
        text body
        datetime created_at
    }

    LIKE {
        UUID id PK
        UUID post_id FK
        UUID user_id FK
        datetime created_at
    }

    HIGHLIGHT {
        UUID id PK
        UUID post_id FK
        UUID user_id FK
        text reason
        datetime created_at
    }

    BOOKMARK {
        UUID id PK
        UUID post_id FK
        UUID user_id FK
        datetime created_at
    }

    OFFLINE_CONTENT {
        UUID id PK
        UUID user_id FK
        UUID post_id FK
        integer size_bytes
        datetime cached_at
        datetime last_accessed_at
        datetime expires_at "cached_at + 1 month"
    }

    DM_THREAD {
        UUID id PK
        UUID user1_id FK
        UUID user2_id FK
        datetime created_at
    }

    DIRECT_MESSAGE {
        UUID id PK
        UUID thread_id FK
        UUID sender_id FK
        enum message_type
        text text_content
        string media_url
        boolean is_read
        datetime created_at
    }

    LIVE_ROOM {
        UUID id PK
        UUID host_user_id FK
        string title
        enum status
        string livekit_room_name
        integer max_speakers
        boolean is_recording
        UUID post_id FK
        datetime started_at
        datetime ended_at
        datetime created_at
    }

    ROOM_PARTICIPANT {
        UUID id PK
        UUID room_id FK
        UUID user_id FK
        enum role
        datetime joined_at
        datetime left_at
    }

    ROOM_CHAT {
        UUID id PK
        UUID room_id FK
        UUID user_id FK
        text content
        string shared_url
        boolean is_pinned
        datetime created_at
    }

    GIFT {
        UUID id PK
        UUID sender_id FK
        UUID recipient_id FK
        UUID post_id FK
        UUID room_id FK
        integer amount
        decimal platform_fee_rate
        string stores_payment_id
        datetime created_at
    }

    EVENT {
        UUID id PK
        UUID creator_user_id FK
        string name
        text description
        enum event_type
        string location
        datetime starts_at
        datetime ends_at
        decimal fee
        string currency
        text refund_policy
        UUID live_room_id FK
        datetime created_at
    }

    EVENT_PARTICIPANT {
        UUID id PK
        UUID event_id FK
        UUID user_id FK
        enum status
        enum payment_status
        string stores_payment_id
        datetime joined_at
    }

    PRODUCT {
        UUID id PK
        UUID seller_user_id FK
        string title
        text description
        enum product_type
        decimal price
        string currency
        string image_url
        string preview_url
        integer preview_duration
        integer stock
        UUID source_post_id FK
        jsonb ai_description
        datetime created_at
    }

    CART {
        UUID id PK
        UUID buyer_user_id FK
        enum status   "active|checked_out"
        datetime created_at
        datetime updated_at
    }

    CART_ITEM {
        UUID id PK
        UUID cart_id FK
        UUID product_id FK
        integer quantity
        datetime added_at
    }

    "ORDER" {
        UUID id PK
        UUID buyer_user_id FK
        decimal amount
        string stores_payment_id
        enum status
        jsonb shipping_info
        string tracking_number
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEM {
        UUID id PK
        UUID order_id FK
        UUID product_id FK
        integer quantity
        decimal price
    }

    GROUP {
        UUID id PK
        UUID owner_user_id FK
        string name
        text description
        enum group_type
        decimal subscription_price
        string stores_price_id
        integer member_limit
        datetime created_at
    }

    GROUP_MEMBER {
        UUID id PK
        UUID group_id FK
        UUID user_id FK
        enum role
        enum status
        string stores_subscription_id
        datetime joined_at
        datetime left_at
    }

    GROUP_CHAT {
        UUID id PK
        UUID group_id FK
        UUID user_id FK
        enum message_type
        text text_content
        string media_url
        datetime created_at
    }

    AI_PLAYLIST {
        UUID id PK
        UUID user_id FK
        string title
        text description
        enum playlist_type
        datetime generated_at
        datetime expires_at
    }

    AI_PLAYLIST_POST {
        UUID id PK
        UUID playlist_id FK
        UUID post_id FK
    }

    CHAT_SESSION {
        UUID id PK
        UUID user_id FK
        datetime created_at
        datetime ended_at
    }

    CHAT_MESSAGE {
        UUID id PK
        UUID session_id FK
        UUID user_id FK
        enum role
        text content
        jsonb function_calls
        datetime created_at
    }

    SEARCH_HISTORY {
        UUID id PK
        UUID user_id FK
        string query
        datetime searched_at
    }

    NOTIFICATION {
        UUID id PK
        UUID user_id FK
        string title
        string body
        enum notification_type
        jsonb data
        boolean is_read
        datetime created_at
    }

    NOTIFICATION_SETTING {
        UUID id PK
        UUID user_id FK
        enum notification_type
        boolean enabled
        datetime updated_at
    }

    %% 日程調整機能（優先度L）
    SCHEDULE_POLL {
        UUID id PK
        UUID creator_user_id FK
        string title
        text description
        UUID related_event_id FK
        datetime created_at
        datetime deadline_at
    }

    SCHEDULE_CANDIDATE {
        UUID id PK
        UUID poll_id FK
        datetime candidate_datetime
        integer order_index
    }

    SCHEDULE_VOTE {
        UUID id PK
        UUID poll_id FK
        UUID candidate_id FK
        UUID user_id FK
        enum vote_type "available|maybe|unavailable"
        datetime voted_at
    }

    %% Relationships
    PROFILE ||--o{ ACCOUNT : has_account
    PROFILE ||--o{ FOLLOW : follows
    PROFILE ||--o{ POST : creates
    PROFILE ||--o{ STORY : creates
    PROFILE ||--o{ COMMENT : writes
    PROFILE ||--o{ LIKE : likes
    PROFILE ||--o{ HIGHLIGHT : highlights
    PROFILE ||--o{ BOOKMARK : bookmarks
    PROFILE ||--o{ OFFLINE_CONTENT : caches
    PROFILE ||--o{ DM_THREAD : chats_with
    PROFILE ||--o{ DIRECT_MESSAGE : sends_message
    PROFILE ||--o{ LIVE_ROOM : hosts
    PROFILE ||--o{ ROOM_PARTICIPANT : participates_in
    PROFILE ||--o{ ROOM_CHAT : chats_in_room
    PROFILE ||--o{ GIFT : sends_gift
    PROFILE ||--o{ GIFT : receives_gift
    PROFILE ||--o{ EVENT : creates_event
    PROFILE ||--o{ EVENT_PARTICIPANT : joins_event
    PROFILE ||--o{ PRODUCT : sells
    PROFILE ||--o{ CART : owns_cart
    PROFILE ||--o{ "ORDER" : purchases
    PROFILE ||--o{ GROUP : owns_group
    PROFILE ||--o{ GROUP_MEMBER : group_member
    PROFILE ||--o{ GROUP_CHAT : chats_in_group
    PROFILE ||--o{ AI_PLAYLIST : owns_playlist
    PROFILE ||--o{ CHAT_SESSION : starts_session
    PROFILE ||--o{ SEARCH_HISTORY : searches
    PROFILE ||--o{ NOTIFICATION : notified
    PROFILE ||--o{ NOTIFICATION_SETTING : sets
    PROFILE ||--o{ SCHEDULE_POLL : creates_poll
    PROFILE ||--o{ SCHEDULE_VOTE : votes_poll

    POST ||--o{ POST_HASHTAG : has_tag
    HASHTAG ||--o{ POST_HASHTAG : tagged_in
    POST ||--o{ COMMENT : has_comment
    POST ||--o{ LIKE : liked_by
    POST ||--o{ HIGHLIGHT : highlighted_by
    POST ||--o{ BOOKMARK : bookmarked_by
    POST ||--o{ OFFLINE_CONTENT : cached
    POST }o--|| EVENT : related_event
    POST }o--|| GROUP : group_post
    POST ||--o{ GIFT : gifted
    POST }o--|| PRODUCT : source_product
    AI_PLAYLIST ||--o{ AI_PLAYLIST_POST : links
    POST ||--o{ AI_PLAYLIST_POST : in_playlist

    STORY ||--o| STORY : reposts

    DM_THREAD ||--o{ DIRECT_MESSAGE : contains
    DM_THREAD ||--|| PROFILE : user_pair

    LIVE_ROOM ||--o{ ROOM_PARTICIPANT : has_participant
    LIVE_ROOM ||--o{ ROOM_CHAT : has_chat
    LIVE_ROOM ||--o{ GIFT : gifted
    LIVE_ROOM ||--o| POST : archived_post
    LIVE_ROOM }o--|| EVENT : workshop_of

    EVENT ||--o{ EVENT_PARTICIPANT : has_participant

    PRODUCT ||--o{ CART_ITEM : in_cart
    PRODUCT ||--o{ ORDER_ITEM : in_order

    CART ||--o{ CART_ITEM : has_items
    "ORDER" ||--o{ ORDER_ITEM : has_lines

    GROUP ||--o{ GROUP_MEMBER : has_member
    GROUP ||--o{ GROUP_CHAT : has_chat
    GROUP ||--o{ POST : has_post

    CHAT_SESSION ||--o{ CHAT_MESSAGE : has_msg

    SCHEDULE_POLL ||--o{ SCHEDULE_CANDIDATE : has_candidates
    SCHEDULE_POLL ||--o{ SCHEDULE_VOTE : has_votes
    SCHEDULE_CANDIDATE ||--o{ SCHEDULE_VOTE : voted_on
    EVENT ||--o| SCHEDULE_POLL : has_poll
```
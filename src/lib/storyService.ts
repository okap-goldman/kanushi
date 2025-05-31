import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { mockConfig, mockDelay, getMockStoryGroups, generateId, getCurrentTimestamp } from './mockData';

export interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  imageUrl: string; // 画像必須
  audioUrl: string; // 音声必須
  audioTranscript?: string; // 音声の文字起こし
  contentType: 'image' | 'video'; // 下位互換性のため残す
  mediaUrl: string; // 下位互換性のため残す
  thumbnailUrl?: string;
  caption?: string;
  viewsCount: number;
  createdAt: string;
  expiresAt: string;
}

export interface UserStories {
  userId: string;
  username: string;
  profileImage: string;
  stories: Story[];
  hasUnviewedStory: boolean;
}

// ストーリーの取得（フォローユーザーのストーリーを含む）
export async function getStories(): Promise<UserStories[]> {
  try {
    // モックモードの場合
    if (mockConfig.enabled) {
      await mockDelay();
      
      const mockGroups = getMockStoryGroups();
      const userStories: UserStories[] = mockGroups.map(group => ({
        userId: group.user_id,
        username: group.user.username,
        profileImage: group.user.avatar_url,
        stories: group.stories.map(story => ({
          id: story.id,
          userId: story.user_id,
          username: group.user.username,
          profileImage: group.user.avatar_url,
          imageUrl: story.image_url,
          audioUrl: story.audio_url,
          audioTranscript: story.audio_transcript,
          contentType: story.media_type === 'audio' ? 'image' : story.media_type,
          mediaUrl: story.media_url,
          thumbnailUrl: story.media_url,
          caption: story.content,
          viewsCount: story.views_count,
          createdAt: story.created_at,
          expiresAt: story.expires_at,
        })),
        hasUnviewedStory: group.has_unviewed,
      }));
      
      return userStories;
    }
    // 24時間以内のストーリーを取得
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
        image_url,
        audio_url,
        audio_transcript,
        content_type,
        media_url,
        thumbnail_url,
        caption,
        views_count,
        created_at,
        expires_at,
        profiles:user_id (
          id,
          name,
          image,
          username
        )
      `)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!stories) return [];

    // ビュー情報を取得（閲覧済みかどうか判断するため）
    const { data: currentUser } = await supabase.auth.getUser();

    if (!currentUser?.user) return [];

    const { data: storyViews } = await supabase
      .from('story_views')
      .select('story_id')
      .eq('user_id', currentUser.user.id);

    const viewedStoryIds = new Set(storyViews?.map((view) => view.story_id) || []);

    // ユーザーごとにストーリーをグループ化
    const userStoriesMap = new Map<string, UserStories>();

    stories.forEach((story) => {
      const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
      if (!profile) return; // Skip if no profile

      const userId = profile.id;

      const storyObj: Story = {
        id: story.id,
        userId: profile.id,
        username: profile.username,
        profileImage: profile.image,
        imageUrl: story.image_url,
        audioUrl: story.audio_url,
        audioTranscript: story.audio_transcript || undefined,
        contentType: story.content_type as 'image' | 'video',
        mediaUrl: story.media_url,
        thumbnailUrl: story.thumbnail_url || undefined,
        caption: story.caption || undefined,
        viewsCount: story.views_count,
        createdAt: story.created_at,
        expiresAt: story.expires_at,
      };

      if (userStoriesMap.has(userId)) {
        const userStories = userStoriesMap.get(userId)!;
        userStories.stories.push(storyObj);

        if (!viewedStoryIds.has(story.id)) {
          userStories.hasUnviewedStory = true;
        }
      } else {
        userStoriesMap.set(userId, {
          userId: profile.id,
          username: profile.username,
          profileImage: profile.image,
          stories: [storyObj],
          hasUnviewedStory: !viewedStoryIds.has(story.id),
        });
      }
    });

    // 未閲覧ストーリーがあるユーザーを優先的に表示
    return Array.from(userStoriesMap.values()).sort((a, b) => {
      // 未閲覧ストーリーがあるユーザーを優先
      if (a.hasUnviewedStory && !b.hasUnviewedStory) return -1;
      if (!a.hasUnviewedStory && b.hasUnviewedStory) return 1;

      // 同じ場合は新しいストーリーがあるユーザーを優先
      const aLatest = a.stories.reduce(
        (latest, story) =>
          new Date(story.createdAt) > new Date(latest.createdAt) ? story : latest,
        a.stories[0]
      );

      const bLatest = b.stories.reduce(
        (latest, story) =>
          new Date(story.createdAt) > new Date(latest.createdAt) ? story : latest,
        b.stories[0]
      );

      return new Date(bLatest.createdAt).getTime() - new Date(aLatest.createdAt).getTime();
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

// ストーリー閲覧記録
export async function viewStory(storyId: string): Promise<void> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();

    if (!currentUser?.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase.from('story_views').upsert(
      {
        id: Crypto.randomUUID(),
        story_id: storyId,
        user_id: currentUser.user.id,
        viewed_at: new Date().toISOString(),
      },
      {
        onConflict: 'story_id,user_id',
      }
    );

    if (error) throw error;
  } catch (error) {
    console.error('Error recording story view:', error);
  }
}

// ストーリーの投稿（音声と画像の両方必須）
export async function createStory(
  audioFile: { uri: string; type: string; name: string },
  imageFile: { uri: string; type: string; name: string },
  audioTranscript?: string,
  caption?: string
): Promise<Story | null> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();

    if (!currentUser?.user) {
      throw new Error('User not authenticated');
    }

    // 音声ファイルのアップロード
    const audioExt = audioFile.type.split('/')[1] || 'mp3';
    const audioFileName = `${Crypto.randomUUID()}.${audioExt}`;
    const audioFilePath = `stories/audio/${currentUser.user.id}/${audioFileName}`;

    const audioResponse = await fetch(audioFile.uri);
    const audioBlob = await audioResponse.blob();

    const { error: audioUploadError } = await supabase.storage
      .from('stories')
      .upload(audioFilePath, audioBlob, {
        contentType: audioFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (audioUploadError) throw audioUploadError;

    const { data: audioUrlData } = supabase.storage.from('stories').getPublicUrl(audioFilePath);
    if (!audioUrlData) throw new Error('Failed to get audio public URL');
    const audioUrl = audioUrlData.publicUrl;

    // 画像ファイルのアップロード
    const imageExt = imageFile.type.split('/')[1] || 'jpg';
    const imageFileName = `${Crypto.randomUUID()}.${imageExt}`;
    const imageFilePath = `stories/images/${currentUser.user.id}/${imageFileName}`;

    const imageResponse = await fetch(imageFile.uri);
    const imageBlob = await imageResponse.blob();

    const { error: imageUploadError } = await supabase.storage
      .from('stories')
      .upload(imageFilePath, imageBlob, {
        contentType: imageFile.type,
        cacheControl: '3600',
        upsert: false,
      });

    if (imageUploadError) throw imageUploadError;

    const { data: imageUrlData } = supabase.storage.from('stories').getPublicUrl(imageFilePath);
    if (!imageUrlData) throw new Error('Failed to get image public URL');
    const imageUrl = imageUrlData.publicUrl;

    // ストーリーをデータベースに保存
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: currentUser.user.id,
        image_url: imageUrl,
        audio_url: audioUrl,
        audio_transcript: audioTranscript || null,
        content_type: 'image',
        media_url: imageUrl, // 下位互換性のため
        thumbnail_url: imageUrl,
        caption: caption || null,
        views_count: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24時間後
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // プロフィール情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, image, username')
      .eq('id', currentUser.user.id)
      .single();

    if (profileError) throw profileError;

    return {
      id: story.id,
      userId: story.user_id,
      username: profile.username,
      profileImage: profile.image,
      imageUrl: story.image_url,
      audioUrl: story.audio_url,
      audioTranscript: story.audio_transcript || undefined,
      contentType: story.content_type,
      mediaUrl: story.media_url,
      thumbnailUrl: story.thumbnail_url || undefined,
      caption: story.caption || undefined,
      viewsCount: story.views_count,
      createdAt: story.created_at,
      expiresAt: story.expires_at,
    };
  } catch (error) {
    console.error('Error creating story:', error);
    return null;
  }
}

// 下位互換性のための旧関数（非推奨）
export async function createStoryLegacy(
  fileUri: string,
  fileType: string,
  caption?: string,
  contentType: 'image' | 'video' = 'image'
): Promise<Story | null> {
  console.warn('createStoryLegacy is deprecated. Use createStory with both audio and image files.');
  
  // 新仕様では音声と画像の両方が必須のため、この関数は使用不可
  throw new Error('Legacy story creation is not supported. Audio and image are both required.');
}

// ストーリーの削除
export async function deleteStory(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('stories').delete().eq('id', storyId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    return false;
  }
}

import { supabase } from './supabase';
import * as Crypto from 'expo-crypto';

export interface Story {
  id: string;
  userId: string;
  username: string;
  profileImage: string;
  contentType: 'image' | 'video';
  mediaUrl: string;
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
    // 24時間以内のストーリーを取得
    const { data: stories, error } = await supabase
      .from('stories')
      .select(`
        id,
        user_id,
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
    
    const viewedStoryIds = new Set(storyViews?.map(view => view.story_id) || []);

    // ユーザーごとにストーリーをグループ化
    const userStoriesMap = new Map<string, UserStories>();
    
    stories.forEach(story => {
      const profile = Array.isArray(story.profiles) ? story.profiles[0] : story.profiles;
      if (!profile) return; // Skip if no profile
      
      const userId = profile.id;
      
      const storyObj: Story = {
        id: story.id,
        userId: profile.id,
        username: profile.username,
        profileImage: profile.image,
        contentType: story.content_type as 'image' | 'video',
        mediaUrl: story.media_url,
        thumbnailUrl: story.thumbnail_url || undefined,
        caption: story.caption || undefined,
        viewsCount: story.views_count,
        createdAt: story.created_at,
        expiresAt: story.expires_at
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
          hasUnviewedStory: !viewedStoryIds.has(story.id)
        });
      }
    });
    
    // 未閲覧ストーリーがあるユーザーを優先的に表示
    return Array.from(userStoriesMap.values()).sort((a, b) => {
      // 未閲覧ストーリーがあるユーザーを優先
      if (a.hasUnviewedStory && !b.hasUnviewedStory) return -1;
      if (!a.hasUnviewedStory && b.hasUnviewedStory) return 1;
      
      // 同じ場合は新しいストーリーがあるユーザーを優先
      const aLatest = a.stories.reduce((latest, story) => 
        new Date(story.createdAt) > new Date(latest.createdAt) ? story : latest, a.stories[0]);
      
      const bLatest = b.stories.reduce((latest, story) => 
        new Date(story.createdAt) > new Date(latest.createdAt) ? story : latest, b.stories[0]);
        
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
    
    const { error } = await supabase
      .from('story_views')
      .upsert({
        id: Crypto.randomUUID(),
        story_id: storyId,
        user_id: currentUser.user.id,
        viewed_at: new Date().toISOString()
      }, {
        onConflict: 'story_id,user_id'
      });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error recording story view:', error);
  }
}

// ストーリーの投稿
export async function createStory(
  fileUri: string,
  fileType: string,
  caption?: string,
  contentType: 'image' | 'video' = 'image'
): Promise<Story | null> {
  try {
    const { data: currentUser } = await supabase.auth.getUser();
    
    if (!currentUser?.user) {
      throw new Error('User not authenticated');
    }
    
    // 一意のファイル名を生成
    const fileExt = fileType.split('/')[1] || 'jpg';
    const fileName = `${Crypto.randomUUID()}.${fileExt}`;
    const filePath = `stories/${currentUser.user.id}/${fileName}`;
    
    // ファイルを読み込んでBlobに変換
    const response = await fetch(fileUri);
    const blob = await response.blob();
    
    // ファイルをアップロード
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, blob, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) throw uploadError;
    
    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);
      
    if (!urlData) throw new Error('Failed to get public URL');
    
    const mediaUrl = urlData.publicUrl;
    
    // サムネイルURL (ビデオの場合は別途サムネイル生成が必要)
    const thumbnailUrl = contentType === 'image' ? mediaUrl : undefined;
    
    // ストーリーをデータベースに保存
    const { data: story, error: insertError } = await supabase
      .from('stories')
      .insert({
        user_id: currentUser.user.id,
        content_type: contentType,
        media_url: mediaUrl,
        thumbnail_url: thumbnailUrl,
        caption: caption || null,
        views_count: 0,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24時間後
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
      contentType: story.content_type,
      mediaUrl: story.media_url,
      thumbnailUrl: story.thumbnail_url || undefined,
      caption: story.caption || undefined,
      viewsCount: story.views_count,
      createdAt: story.created_at,
      expiresAt: story.expires_at
    };
  } catch (error) {
    console.error('Error creating story:', error);
    return null;
  }
}

// ストーリーの削除
export async function deleteStory(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId);
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    return false;
  }
}
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';

// Fallback values are included for development
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://dpmrgzjvljaacdwggnaf.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwbXJnemp2bGphYWNkd2dnbmFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMTY0MTMsImV4cCI6MjA2MzU5MjQxM30.myHmmx_dc3NQkPS5rnfw6sEFH24gFmt878K526bgPPY';

// Web platform fallback using localStorage
const webStorage = {
  getItem: (key: string) => {
    const item = localStorage.getItem(key);
    return Promise.resolve(item);
  },
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key);
    return Promise.resolve();
  },
};

// Custom storage implementation using SecureStore for native platforms and localStorage for web
const ExpoSecureStoreAdapter = Platform.OS === 'web' 
  ? webStorage 
  : {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// File upload function
export const uploadFile = async (
  file: any,
  bucket: string = 'media',
  folder: string = 'uploads'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    // For React Native, we need to get file from URI
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${file.name.split('.').pop()}`;
    
    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Upload error:', error);
    return { url: null, error: error as Error };
  }
};

// Audio blob upload function for voice messages
export const uploadAudioBlob = async (
  blob: Blob,
  bucket: string = 'media',
  folder: string = 'audio-messages'
): Promise<{ url: string | null; error: Error | null }> => {
  try {
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.wav`;
    
    // Upload blob
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        contentType: 'audio/wav',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return { url: data.publicUrl, error: null };
  } catch (error) {
    console.error('Audio upload error:', error);
    return { url: null, error: error as Error };
  }
};

// Post data interface
export interface PostData {
  user_id: string;
  content_type: string;
  text_content: string;
  media_url?: string | null;
  audio_url?: string | null;
  thumbnail_url?: string | null;
  tags?: string[];
}

// Save post function
export const savePost = async (
  postData: PostData
): Promise<{ success: boolean; error: Error | null; data: any }> => {
  try {
    // Handle media URL if it's an array
    let primaryMediaUrl = null;
    if (Array.isArray(postData.media_url) && postData.media_url.length > 0) {
      primaryMediaUrl = postData.media_url[0];
    } else if (typeof postData.media_url === 'string') {
      primaryMediaUrl = postData.media_url;
    }

    // Insert post
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: postData.user_id,
        content_type: postData.content_type,
        text_content: postData.text_content,
        media_url: Array.isArray(postData.media_url) ? JSON.stringify(postData.media_url) : postData.media_url,
        audio_url: postData.audio_url,
        thumbnail_url: postData.thumbnail_url || primaryMediaUrl,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    // Handle tags
    if (postData.tags && postData.tags.length > 0 && data && data.length > 0) {
      const postId = data[0].id;
      
      // Process each tag
      for (const tagName of postData.tags) {
        // Find existing tag
        const { data: existingTag, error: findError } = await supabase
          .from('tags')
          .select('id')
          .eq('name', tagName)
          .maybeSingle();
        
        if (findError) {
          console.error(`Error finding tag ${tagName}:`, findError);
          continue;
        }
        
        let tagId;
        
        // Create tag if it doesn't exist
        if (!existingTag) {
          const { data: newTag, error: createError } = await supabase
            .from('tags')
            .insert({ name: tagName })
            .select()
            .single();
          
          if (createError) {
            console.error(`Error creating tag ${tagName}:`, createError);
            continue;
          }
          
          tagId = newTag.id;
        } else {
          tagId = existingTag.id;
        }
        
        // Link tag to post
        const { error: linkError } = await supabase
          .from('post_tags')
          .insert({
            post_id: postId,
            tag_id: tagId
          });
        
        if (linkError) {
          console.error(`Error linking tag ${tagName} to post:`, linkError);
        }
      }
    }

    return { success: true, error: null, data };
  } catch (error) {
    console.error('Post save error:', error);
    return { success: false, error: error as Error, data: null };
  }
};
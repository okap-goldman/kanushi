import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import { mockConfig, mockDelay, mockCurrentUser } from './mockData';

export const profileService = {
  async ensureProfileExists(user: User) {
    try {
      // モックモードの場合
      if (mockConfig.enabled) {
        await mockDelay();
        return true; // モックモードでは常に成功を返す
      }
      // Check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profile')
        .select('id')
        .eq('id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found"
        console.error('Error checking profile:', checkError);
        throw checkError;
      }

      // If profile doesn't exist, create it
      if (!existingProfile) {
        const username =
          user.user_metadata?.username ||
          user.email?.split('@')[0] ||
          `user_${Math.random().toString(36).substring(2, 9)}`;

        const { error: createError } = await supabase.from('profile').insert({
          id: user.id,
          display_name: user.user_metadata?.name || username,
          profile_image_url: user.user_metadata?.image || 'https://via.placeholder.com/150',
          profile_text: user.user_metadata?.bio || '',
        });

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }

        console.log('Profile created for user:', user.id);
      }

      return true;
    } catch (error) {
      console.error('Error ensuring profile exists:', error);
      return false;
    }
  },
};
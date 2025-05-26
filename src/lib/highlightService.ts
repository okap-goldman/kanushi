import type { ApiResponse } from './data';
import { supabase } from './supabase';

export interface Highlight {
  id: string;
  post_id: string;
  user_id: string;
  reason: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    image: string;
  };
}

/**
 * Create a highlight on a post
 * @param highlight Highlight data without ID
 */
export const createHighlight = async (highlight: {
  post_id: string;
  user_id: string;
  reason: string;
}): Promise<ApiResponse<Highlight>> => {
  try {
    // Validate reason
    if (!highlight.reason || highlight.reason.trim() === '') {
      throw new Error('Reason is required for highlighting');
    }

    if (highlight.reason.trim().length < 5) {
      throw new Error('Reason must be at least 5 characters long');
    }

    // Insert highlight
    const { data, error } = await supabase
      .from('highlight')
      .insert({
        post_id: highlight.post_id,
        user_id: highlight.user_id,
        reason: highlight.reason,
      })
      .select()
      .single();

    if (error) {
      // Check for duplicate highlight
      if (error.code === '23505') {
        throw new Error('You have already highlighted this post');
      }
      throw error;
    }

    return { data: data as Highlight, error: null };
  } catch (error) {
    console.error('Error creating highlight:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Remove a highlight from a post
 * @param post_id The post ID
 * @param user_id The user ID
 */
export const removeHighlight = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { error } = await supabase
      .from('highlight')
      .delete()
      .eq('post_id', post_id)
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('Error removing highlight:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Get all highlights for a post
 * @param post_id The post ID
 */
export const getHighlights = async (post_id: string): Promise<ApiResponse<Highlight[]>> => {
  try {
    const { data, error } = await supabase
      .from('highlight')
      .select(`
        *,
        user:profiles(id, name, image)
      `)
      .eq('post_id', post_id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Format the response
    const formattedHighlights = (data || []).map((highlight) => ({
      ...highlight,
      user: highlight.user && highlight.user[0] ? highlight.user[0] : undefined,
    })) as Highlight[];

    return { data: formattedHighlights, error: null };
  } catch (error) {
    console.error('Error fetching highlights:', error);
    return { data: null, error: error as Error };
  }
};

/**
 * Check if a user has highlighted a post
 * @param post_id The post ID
 * @param user_id The user ID
 */
export const checkHighlighted = async (
  post_id: string,
  user_id: string
): Promise<ApiResponse<boolean>> => {
  try {
    const { data, error } = await supabase
      .from('highlight')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return { data: !!data, error: null };
  } catch (error) {
    console.error('Error checking highlight status:', error);
    return { data: null, error: error as Error };
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface SearchHistoryItem {
  id: string;
  query: string;
  type: 'all' | 'users' | 'posts' | 'hashtags' | 'events' | 'products';
  timestamp: string;
}

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_SEARCH_HISTORY = 10;

export class SearchHistoryService {
  async getSearchHistory(): Promise<SearchHistoryItem[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const key = `${SEARCH_HISTORY_KEY}_${user.id}`;
      const historyString = await AsyncStorage.getItem(key);
      if (!historyString) return [];

      const history = JSON.parse(historyString) as SearchHistoryItem[];
      return history.slice(0, MAX_SEARCH_HISTORY);
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  async addSearchHistory(query: string, type: SearchHistoryItem['type'] = 'all'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const key = `${SEARCH_HISTORY_KEY}_${user.id}`;
      const existingHistory = await this.getSearchHistory();

      // Remove duplicate queries
      const filteredHistory = existingHistory.filter(item => 
        !(item.query.toLowerCase() === query.toLowerCase() && item.type === type)
      );

      const newItem: SearchHistoryItem = {
        id: `${Date.now()}_${Math.random()}`,
        query,
        type,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [newItem, ...filteredHistory].slice(0, MAX_SEARCH_HISTORY);
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error adding search history:', error);
    }
  }

  async removeSearchHistoryItem(id: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const key = `${SEARCH_HISTORY_KEY}_${user.id}`;
      const existingHistory = await this.getSearchHistory();
      const updatedHistory = existingHistory.filter(item => item.id !== id);
      await AsyncStorage.setItem(key, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error removing search history item:', error);
    }
  }

  async clearSearchHistory(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const key = `${SEARCH_HISTORY_KEY}_${user.id}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  }

  async getSuggestedUsers(limit: number = 5): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get users that the current user is not following
      const { data: suggestedUsers, error } = await supabase
        .from('profile')
        .select(`
          id,
          display_name,
          profile_text,
          profile_image_url,
          prefecture,
          city
        `)
        .neq('id', user.id)
        .not('id', 'in', `(
          SELECT followee_id 
          FROM follow 
          WHERE follower_id = '${user.id}'
            AND status = 'active'
        )`)
        .limit(limit);

      if (error) throw error;

      return suggestedUsers || [];
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return [];
    }
  }
}

export const searchHistoryService = new SearchHistoryService();
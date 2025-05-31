import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  searchHashtags,
  getPopularHashtags,
  getRecentHashtags,
  incrementHashtagUse,
  extractHashtags,
  formatTextWithHashtags,
  type Hashtag,
  type HashtagSearchResult,
} from '../../src/lib/hashtagService';
import { supabase } from '../../src/lib/supabase';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockHashtags: Hashtag[] = [
  {
    id: '1',
    name: 'スピリチュアル',
    use_count: 150,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: '瞑想',
    use_count: 120,
    created_at: '2025-01-02T00:00:00Z',
  },
  {
    id: '3',
    name: 'mindfulness',
    use_count: 80,
    created_at: '2025-01-03T00:00:00Z',
  },
  {
    id: '4',
    name: '目醒め',
    use_count: 200,
    created_at: '2025-01-04T00:00:00Z',
  },
];

describe('hashtagService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('searchHashtags', () => {
    it('should search hashtags successfully with valid query', async () => {
      const mockResult = {
        data: [mockHashtags[0], mockHashtags[1]],
        error: null,
        count: 2,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const result = await searchHashtags('スピ');

      expect(result).toEqual({
        hashtags: [mockHashtags[0], mockHashtags[1]],
        totalCount: 2,
      });

      expect(supabase.from).toHaveBeenCalledWith('tags');
    });

    it('should return empty result for short query (less than 2 characters)', async () => {
      const result = await searchHashtags('a');

      expect(result).toEqual({
        hashtags: [],
        totalCount: 0,
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should return empty result for empty query', async () => {
      const result = await searchHashtags('');

      expect(result).toEqual({
        hashtags: [],
        totalCount: 0,
      });

      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('should handle query with # prefix', async () => {
      const mockResult = {
        data: [mockHashtags[0]],
        error: null,
        count: 1,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      await searchHashtags('#スピリチュアル');

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.ilike).toHaveBeenCalledWith('name', '%スピリチュアル%');
    });

    it('should handle database error gracefully', async () => {
      const mockError = new Error('Database error');
      const mockResult = {
        data: null,
        error: mockError,
        count: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await searchHashtags('test');

      expect(result).toEqual({
        hashtags: [],
        totalCount: 0,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error searching hashtags:', mockError);
      consoleSpy.mockRestore();
    });

    it('should respect limit parameter', async () => {
      const mockResult = {
        data: mockHashtags.slice(0, 5),
        error: null,
        count: 5,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      await searchHashtags('test', 5);

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });

    it('should order by use_count descending, then created_at descending', async () => {
      const mockResult = {
        data: [],
        error: null,
        count: 0,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      await searchHashtags('test');

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.order).toHaveBeenNthCalledWith(1, 'use_count', { ascending: false });
      expect(mockChain.order).toHaveBeenNthCalledWith(2, 'created_at', { ascending: false });
    });
  });

  describe('getPopularHashtags', () => {
    it('should get popular hashtags successfully', async () => {
      const mockResult = {
        data: mockHashtags,
        error: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const result = await getPopularHashtags();

      expect(result).toEqual(mockHashtags);

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.gt).toHaveBeenCalledWith('use_count', 0);
      expect(mockChain.order).toHaveBeenCalledWith('use_count', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(20);
    });

    it('should respect custom limit', async () => {
      const mockResult = {
        data: mockHashtags.slice(0, 10),
        error: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      await getPopularHashtags(10);

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should handle database error gracefully', async () => {
      const mockError = new Error('Database error');
      const mockResult = {
        data: null,
        error: mockError,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getPopularHashtags();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting popular hashtags:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('getRecentHashtags', () => {
    it('should get recent hashtags successfully', async () => {
      const mockResult = {
        data: mockHashtags,
        error: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const result = await getRecentHashtags();

      expect(result).toEqual(mockHashtags);

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockChain.limit).toHaveBeenCalledWith(10);
    });

    it('should respect custom limit', async () => {
      const mockResult = {
        data: mockHashtags.slice(0, 5),
        error: null,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      await getRecentHashtags(5);

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.limit).toHaveBeenCalledWith(5);
    });

    it('should handle database error gracefully', async () => {
      const mockError = new Error('Database error');
      const mockResult = {
        data: null,
        error: mockError,
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockResult),
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await getRecentHashtags();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting recent hashtags:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('incrementHashtagUse', () => {
    it('should increment use count for existing hashtag', async () => {
      const existingTag = { id: '1', use_count: 10 };
      
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'tags') {
          if (callCount === 1) {
            // First call for select
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: existingTag,
                error: null,
              }),
            } as any;
          } else {
            // Second call for update
            return {
              update: vi.fn().mockReturnThis(),
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            } as any;
          }
        }
        return {} as any;
      });

      await incrementHashtagUse('testhashtag');

      expect(supabase.from).toHaveBeenCalledWith('tags');
      expect(supabase.from).toHaveBeenCalledTimes(2);
      const secondCall = vi.mocked(supabase.from).mock.results[1].value;
      expect(secondCall.update).toHaveBeenCalledWith({ use_count: 11 });
    });

    it('should create new hashtag if it does not exist', async () => {
      const notFoundError = { code: 'PGRST116' };
      
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        callCount++;
        if (table === 'tags') {
          if (callCount === 1) {
            // First call for select
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              single: vi.fn().mockResolvedValue({
                data: null,
                error: notFoundError,
              }),
            } as any;
          } else {
            // Second call for insert
            return {
              insert: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            } as any;
          }
        }
        return {} as any;
      });

      await incrementHashtagUse('newhashtag');

      expect(supabase.from).toHaveBeenCalledTimes(2);
      const secondCall = vi.mocked(supabase.from).mock.results[1].value;
      expect(secondCall.insert).toHaveBeenCalledWith({
        name: 'newhashtag',
        use_count: 1,
      });
    });

    it('should handle # prefix in tag name', async () => {
      const existingTag = { id: '1', use_count: 5 };
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: existingTag,
          error: null,
        }),
        update: vi.fn().mockReturnThis(),
      } as any);

      await incrementHashtagUse('#TestHashtag');

      const mockChain = vi.mocked(supabase.from).mock.results[0].value;
      expect(mockChain.eq).toHaveBeenCalledWith('name', 'testhashtag');
    });

    it('should handle database errors gracefully', async () => {
      const mockError = new Error('Database error');
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      } as any);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await incrementHashtagUse('errortest');

      expect(consoleSpy).toHaveBeenCalledWith('Error checking hashtag:', mockError);
      consoleSpy.mockRestore();
    });
  });

  describe('extractHashtags', () => {
    it('should extract hashtags from English text', () => {
      const text = 'Hello #world and #test #programming';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['world', 'test', 'programming']);
    });

    it('should extract hashtags from Japanese text', () => {
      const text = 'こんにちは #スピリチュアル と #瞑想 #目醒め について話しましょう';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['スピリチュアル', '瞑想', '目醒め']);
    });

    it('should extract hashtags from mixed language text', () => {
      const text = 'Let\'s talk about #mindfulness そして #瞑想 and #spirituality について';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['mindfulness', '瞑想', 'spirituality']);
    });

    it('should extract hashtags with kanji characters', () => {
      const text = '#目醒め #覚醒 #般若心経 #仏教 について学ぼう';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['目醒め', '覚醒', '般若心経', '仏教']);
    });

    it('should handle hashtags with numbers', () => {
      const text = 'Event #2025年 #12月 #day1 starting soon';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['2025年', '12月', 'day1']);
    });

    it('should remove duplicates and convert to lowercase', () => {
      const text = '#Test #TEST #test #Different';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['test', 'different']);
    });

    it('should return empty array for text without hashtags', () => {
      const text = 'This is just regular text without any hashtags';
      const result = extractHashtags(text);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for empty or null text', () => {
      expect(extractHashtags('')).toEqual([]);
      expect(extractHashtags(null as any)).toEqual([]);
      expect(extractHashtags(undefined as any)).toEqual([]);
    });

    it('should handle hashtags at the beginning, middle, and end of text', () => {
      const text = '#start この文章の #middle 最後に #end';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['start', 'middle', 'end']);
    });

    it('should handle special Japanese characters', () => {
      const text = '#々 #〇 #〻 some special characters';
      const result = extractHashtags(text);
      
      expect(result).toEqual(['々', '〇', '〻']);
    });
  });

  describe('formatTextWithHashtags', () => {
    it('should format hashtags with HTML spans in English text', () => {
      const text = 'Hello #world and #test';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(
        'Hello <span style="color: #0070F3; font-weight: 500;">#world</span> and <span style="color: #0070F3; font-weight: 500;">#test</span>'
      );
    });

    it('should format hashtags with HTML spans in Japanese text', () => {
      const text = 'こんにちは #スピリチュアル と #瞑想';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(
        'こんにちは <span style="color: #0070F3; font-weight: 500;">#スピリチュアル</span> と <span style="color: #0070F3; font-weight: 500;">#瞑想</span>'
      );
    });

    it('should format hashtags with mixed content', () => {
      const text = 'Let\'s #meditate そして #瞑想しよう123';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(
        'Let\'s <span style="color: #0070F3; font-weight: 500;">#meditate</span> そして <span style="color: #0070F3; font-weight: 500;">#瞑想しよう123</span>'
      );
    });

    it('should return original text when no hashtags present', () => {
      const text = 'This is just regular text';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(text);
    });

    it('should return empty string for empty input', () => {
      expect(formatTextWithHashtags('')).toBe('');
      expect(formatTextWithHashtags(null as any)).toBe('');
      expect(formatTextWithHashtags(undefined as any)).toBe('');
    });

    it('should handle text with only hashtags', () => {
      const text = '#one #two #three';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(
        '<span style="color: #0070F3; font-weight: 500;">#one</span> <span style="color: #0070F3; font-weight: 500;">#two</span> <span style="color: #0070F3; font-weight: 500;">#three</span>'
      );
    });

    it('should preserve line breaks and other formatting', () => {
      const text = 'Line 1 #hashtag1\nLine 2 #hashtag2\n\nLine 4 #hashtag3';
      const result = formatTextWithHashtags(text);
      
      expect(result).toBe(
        'Line 1 <span style="color: #0070F3; font-weight: 500;">#hashtag1</span>\nLine 2 <span style="color: #0070F3; font-weight: 500;">#hashtag2</span>\n\nLine 4 <span style="color: #0070F3; font-weight: 500;">#hashtag3</span>'
      );
    });
  });

  describe('type safety and interfaces', () => {
    it('should have correct Hashtag interface', () => {
      const hashtag: Hashtag = {
        id: '1',
        name: 'test',
        use_count: 10,
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(hashtag.id).toBe('1');
      expect(hashtag.name).toBe('test');
      expect(hashtag.use_count).toBe(10);
      expect(hashtag.created_at).toBe('2025-01-01T00:00:00Z');
    });

    it('should have correct HashtagSearchResult interface', () => {
      const searchResult: HashtagSearchResult = {
        hashtags: [mockHashtags[0]],
        totalCount: 1,
      };

      expect(searchResult.hashtags).toHaveLength(1);
      expect(searchResult.totalCount).toBe(1);
    });
  });
});
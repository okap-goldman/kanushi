import { supabase } from './supabase';

export interface Hashtag {
  id: string;
  name: string;
  use_count: number;
  created_at: string;
}

export interface HashtagSearchResult {
  hashtags: Hashtag[];
  totalCount: number;
}

/**
 * ハッシュタグを検索する
 * @param query 検索クエリ（#なし）
 * @param limit 取得件数制限（デフォルト: 10）
 * @returns ハッシュタグの検索結果
 */
export async function searchHashtags(query: string, limit = 10): Promise<HashtagSearchResult> {
  try {
    if (!query || query.length < 2) {
      return { hashtags: [], totalCount: 0 };
    }

    // # を除去し、小文字に変換
    const cleanQuery = query.replace(/^#/, '').toLowerCase();

    const { data, error, count } = await supabase
      .from('tags')
      .select('id, name, use_count, created_at', { count: 'exact' })
      .ilike('name', `%${cleanQuery}%`)
      .order('use_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching hashtags:', error);
      return { hashtags: [], totalCount: 0 };
    }

    return {
      hashtags: data || [],
      totalCount: count || 0,
    };
  } catch (error) {
    console.error('Error in searchHashtags:', error);
    return { hashtags: [], totalCount: 0 };
  }
}

/**
 * 人気のハッシュタグを取得する
 * @param limit 取得件数制限（デフォルト: 20）
 * @returns 人気のハッシュタグリスト
 */
export async function getPopularHashtags(limit = 20): Promise<Hashtag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, use_count, created_at')
      .gt('use_count', 0)
      .order('use_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting popular hashtags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getPopularHashtags:', error);
    return [];
  }
}

/**
 * 最近作成されたハッシュタグを取得する
 * @param limit 取得件数制限（デフォルト: 10）
 * @returns 最近のハッシュタグリスト
 */
export async function getRecentHashtags(limit = 10): Promise<Hashtag[]> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, use_count, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent hashtags:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getRecentHashtags:', error);
    return [];
  }
}

/**
 * ハッシュタグの使用回数を増加させる
 * @param tagName ハッシュタグ名（#なし）
 */
export async function incrementHashtagUse(tagName: string): Promise<void> {
  try {
    const cleanTagName = tagName.replace(/^#/, '').toLowerCase();

    // ハッシュタグが存在するかチェック
    const { data: existingTag, error: selectError } = await supabase
      .from('tags')
      .select('id, use_count')
      .eq('name', cleanTagName)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Error checking hashtag:', selectError);
      return;
    }

    if (existingTag) {
      // 既存のハッシュタグの使用回数を増加
      const { error: updateError } = await supabase
        .from('tags')
        .update({ use_count: existingTag.use_count + 1 })
        .eq('id', existingTag.id);

      if (updateError) {
        console.error('Error incrementing hashtag use:', updateError);
      }
    } else {
      // 新しいハッシュタグを作成
      const { error: insertError } = await supabase.from('tags').insert({
        name: cleanTagName,
        use_count: 1,
      });

      if (insertError) {
        console.error('Error creating new hashtag:', insertError);
      }
    }
  } catch (error) {
    console.error('Error in incrementHashtagUse:', error);
  }
}

/**
 * ハッシュタグを含むテキストからハッシュタグを抽出する
 * @param text テキスト
 * @returns 抽出されたハッシュタグのリスト（#なし）
 */
export function extractHashtags(text: string): string[] {
  if (!text) return [];

  // #で始まり、その後に1文字以上の英数字、ひらがな、カタカナ、漢字が続くパターンにマッチ
  const hashtagRegex = /#([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々〇〻\u3400-\u4DBF]+)/g;
  const hashtags: string[] = [];
  let match: RegExpExecArray | null = hashtagRegex.exec(text);

  while (match !== null) {
    const hashtag = match[1].toLowerCase();
    if (!hashtags.includes(hashtag)) {
      hashtags.push(hashtag);
    }
    match = hashtagRegex.exec(text);
  }

  return hashtags;
}

/**
 * テキストにハッシュタグリンクを適用する（表示用）
 * @param text テキスト
 * @returns ハッシュタグがマークアップされたテキスト
 */
export function formatTextWithHashtags(text: string): string {
  if (!text) return '';

  const hashtagRegex = /#([a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF々〇〻\u3400-\u4DBF]+)/g;

  return text.replace(hashtagRegex, (_match, hashtag) => {
    return `<span style="color: #0070F3; font-weight: 500;">#${hashtag}</span>`;
  });
}

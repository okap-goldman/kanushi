import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import type { User } from '@/types/user';

export interface SearchResult {
  users: User[];
  posts: any[]; // 投稿の型定義に合わせて調整
  events: any[]; // イベントの型定義に合わせて調整
}

export async function searchByKeyword(keyword: string, limitCount = 20): Promise<SearchResult> {
  try {
    // ユーザー検索
    const usersQuery = query(
      collection(db, 'users'),
      where('user_name', '>=', keyword),
      where('user_name', '<=', keyword + '\uf8ff'),
      limit(limitCount)
    );
    const userDocs = await getDocs(usersQuery);
    const users = userDocs.docs.map(doc => doc.data() as User);

    // 投稿検索
    const postsQuery = query(
      collection(db, 'posts'),
      where('text_content', '>=', keyword),
      where('text_content', '<=', keyword + '\uf8ff'),
      orderBy('text_content'),
      limit(limitCount)
    );
    const postDocs = await getDocs(postsQuery);
    const posts = postDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // イベント検索
    const eventsQuery = query(
      collection(db, 'events'),
      where('event_name', '>=', keyword),
      where('event_name', '<=', keyword + '\uf8ff'),
      limit(limitCount)
    );
    const eventDocs = await getDocs(eventsQuery);
    const events = eventDocs.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { users, posts, events };
  } catch (error) {
    console.error('検索エラー:', error);
    throw new Error('検索に失敗しました');
  }
}

// 入力が検索クエリか質問かを判定する関数
export function isQuestion(input: string): boolean {
  // 簡易的な判定ロジック
  // 「？」や「?」で終わる、または「何」「誰」「どう」「なぜ」「どこ」などの疑問詞を含む場合は質問と判定
  const questionMarks = ['？', '?'];
  const questionWords = ['何', '誰', 'どう', 'なぜ', 'どこ', 'いつ', 'どの', 'どんな', 'なに', 'だれ', 'どうして', 'なんで'];
  
  // 末尾が「？」や「?」で終わる場合
  if (questionMarks.some(mark => input.trim().endsWith(mark))) {
    return true;
  }
  
  // 疑問詞を含む場合
  if (questionWords.some(word => input.includes(word))) {
    return true;
  }
  
  return false;
}

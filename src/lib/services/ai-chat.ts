import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// モック実装（実際にはGemini APIを使用）
export async function sendChatMessage(userId: string, message: string): Promise<ChatMessage> {
  try {
    // ユーザーメッセージをFirestoreに保存
    const userMessage = {
      userId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    const userMessageRef = await addDoc(collection(db, 'chat_messages'), userMessage);
    
    // 実際の実装ではここでGemini APIを呼び出す
    // モック応答を生成
    const assistantResponse = {
      userId,
      role: 'assistant',
      content: `あなたの質問「${message}」について考えてみました。\n\nこれは目醒めに関する重要なポイントですね。あなた自身はどのように考えていますか？`,
      timestamp: new Date().toISOString()
    };
    
    const assistantMessageRef = await addDoc(collection(db, 'chat_messages'), assistantResponse);
    
    return {
      id: assistantMessageRef.id,
      role: 'assistant',
      content: assistantResponse.content,
      timestamp: assistantResponse.timestamp
    };
  } catch (error) {
    console.error('チャットメッセージ送信エラー:', error);
    throw new Error('チャットメッセージの送信に失敗しました');
  }
}

// ユーザーの1日の質問回数を取得
export async function getUserDailyQuestionCount(userId: string): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const chatQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', userId),
      where('role', '==', 'user'),
      where('timestamp', '>=', today.toISOString()),
      where('timestamp', '<', tomorrow.toISOString())
    );
    
    const querySnapshot = await getDocs(chatQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error('質問回数取得エラー:', error);
    return 0; // エラー時は0を返す
  }
}

// チャット履歴を取得
export async function getChatHistory(userId: string, limitCount = 20): Promise<ChatMessage[]> {
  try {
    const chatQuery = query(
      collection(db, 'chat_messages'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(chatQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      role: doc.data().role,
      content: doc.data().content,
      timestamp: doc.data().timestamp
    } as ChatMessage));
  } catch (error) {
    console.error('チャット履歴取得エラー:', error);
    return []; // エラー時は空配列を返す
  }
}

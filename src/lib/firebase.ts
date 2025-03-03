import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { User } from '@/types/user';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

interface CreateTextPostData {
  userId: string;
  content: {
    text: string;
    html: string;
  };
  images?: string[];
  isPublic: boolean;
}

export const createTextPost = async (data: CreateTextPostData) => {
  const post = {
    userId: data.userId,
    text_content: data.content.text,
    html_content: data.content.html,
    images: data.images || [],
    post_type: 'text' as const,
    visibility: data.isPublic ? 'public' : 'private' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  return await addDoc(collection(db, 'posts'), post);
};

export const updateUserProfile = async (userId: string, userData: Partial<User>): Promise<User> => {
  try {
    // 開発環境でのモックユーザー対応
    const isDevelopment = import.meta.env.MODE === 'development';
    const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;
    
    if (isDevelopment && testingEmail && userId === '12345678') {
      // 開発環境でのモックユーザーの場合、ローカルストレージに保存
      const mockUserData = {
        user_id: parseInt(userId.slice(0, 8), 16),
        uid: userId,
        user_name: userData.user_name || '名称未設定',
        email: testingEmail,
        profile_icon_url: userData.profile_icon_url || 'https://example.com/default-avatar.png',
        profile_audio_url: userData.profile_audio_url || null,
        shop_link_url: userData.shop_link_url || null,
        is_shop_link: userData.is_shop_link || false,
        introduction: userData.introduction || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // ローカルストレージに保存
      localStorage.setItem('mockUserProfile', JSON.stringify(mockUserData));
      console.log('開発環境: モックユーザープロフィールを更新しました', mockUserData);
      
      return mockUserData as User;
    }
    
    // 通常の処理（本番環境）
    const userRef = doc(db, 'users', userId);
    
    // 現在のユーザーデータを取得
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('ユーザーが見つかりません');
    }
    
    const updatedData = {
      ...userSnap.data(),
      ...userData,
      updated_at: new Date().toISOString()
    };
    
    await setDoc(userRef, updatedData);
    return updatedData as User;
  } catch (error) {
    console.error('プロフィール更新エラー:', error);
    throw new Error('プロフィールの更新に失敗しました');
  }
};

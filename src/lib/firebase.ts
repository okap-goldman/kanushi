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

/**
 * Firebaseの初期化と関連機能モジュール
 * 
 * Firebaseの初期化、認証、Firestore、ストレージへの接続を管理します。
 * また、テキスト投稿の作成やユーザープロフィールの更新などの機能も提供します。
 */
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import type { User } from '@/types/user';

/**
 * Firebaseの設定
 * 
 * 環境変数から読み取ったFirebaseの設定情報
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

/**
 * Firebaseアプリのインスタンス
 */
export const app = initializeApp(firebaseConfig);
/**
 * Firebase認証のインスタンス
 */
export const auth = getAuth(app);
/**
 * Firestoreデータベースのインスタンス
 */
export const db = getFirestore(app);
/**
 * Firebaseストレージのインスタンス
 */
export const storage = getStorage(app);

/**
 * 開発環境でFirebaseエミュレーターを使用する設定
 * 
 * 開発環境の場合、認証、Firestore、ストレージのエミュレーターに接続します。
 */
const useEmulator = import.meta.env.MODE === 'development';
if (useEmulator) {
  console.log('Firebase Emulators を使用します');
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8088);
  connectStorageEmulator(storage, 'localhost', 9199);
}

/**
 * テキスト投稿データの型定義
 * 
 * @interface CreateTextPostData
 * @property {string} userId - 投稿ユーザーのID
 * @property {Object} content - 投稿内容
 * @property {string} content.text - プレーンテキスト形式のコンテンツ
 * @property {string} content.html - HTML形式のコンテンツ
 * @property {string[]} [images] - 投稿に添付する画像のURL配列（省略可能）
 * @property {boolean} isPublic - 公開設定（true: 公開、false: 非公開）
 */
interface CreateTextPostData {
  userId: string;
  content: {
    text: string;
    html: string;
  };
  images?: string[];
  isPublic: boolean;
}

/**
 * テキスト投稿を作成する関数
 * 
 * Firestoreに新しいテキスト投稿を追加します。
 * 
 * @param {CreateTextPostData} data - 投稿データ
 * @returns {Promise<DocumentReference>} 作成された投稿のドキュメント参照
 */
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

/**
 * ユーザープロフィールを更新する関数
 * 
 * 指定されたユーザーIDのプロフィール情報をFirestoreで更新します。
 * 開発環境ではモックユーザーの対応も行います。
 * 
 * @param {string} userId - 更新するユーザーのID
 * @param {Partial<User>} userData - 更新するユーザーデータ（部分的に指定可能）
 * @returns {Promise<User>} 更新後のユーザーデータ
 * @throws {Error} プロフィール更新に失敗した場合
 */
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
      
      // 開発環境でもFirestoreにユーザードキュメントを作成/更新する
      // これにより、他の機能がFirestoreからユーザー情報を取得できるようになる
      try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, mockUserData);
        console.log('開発環境: Firestoreにモックユーザープロフィールを保存しました');
      } catch (firestoreError) {
        console.warn('開発環境: Firestoreへの保存に失敗しましたが、ローカルストレージには保存されています', firestoreError);
      }
      
      return mockUserData as User;
    }
    
    // 通常の処理（本番環境）
    const userRef = doc(db, 'users', userId);
    
    // 現在のユーザーデータを取得
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      // ユーザードキュメントが存在しない場合は新規作成
      const newUserData = {
        user_id: parseInt(userId.slice(0, 8), 16),
        uid: userId,
        user_name: userData.user_name || '名称未設定',
        email: userData.email || '',
        profile_icon_url: userData.profile_icon_url || null,
        profile_audio_url: userData.profile_audio_url || null,
        shop_link_url: userData.shop_link_url || null,
        is_shop_link: userData.is_shop_link || false,
        introduction: userData.introduction || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...userData
      };
      
      await setDoc(userRef, newUserData);
      return newUserData as User;
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

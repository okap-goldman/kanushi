import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, doc, updateDoc } from 'firebase/firestore';

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

interface UserProfileData {
  user_name?: string;
  profile_icon_url?: string;
  profile_audio_url?: string;
  shop_link_url?: string;
  is_shop_link?: boolean;
  introduction?: string;
  pronouns?: string;
}

export const updateUserProfile = async (userId: string, data: UserProfileData) => {
  const userRef = doc(db, 'users', userId);
  return await updateDoc(userRef, {
    ...data,
    updated_at: new Date().toISOString()
  });
};

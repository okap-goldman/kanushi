/**
 * プロフィールヘッダーモジュール
 * 
 * ユーザープロフィールの上部セクションを表示するコンポーネントを提供します。
 * プロフィール画像、名前、自己紹介、統計情報、音声再生機能などが含まれています。
 */
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play, Pause, Store, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import ProfileEditForm from "@/pages/profile/edit-form";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * プロフィールヘッダーコンポーネントのプロパティ型定義
 * 
 * @typedef {Object} ProfileHeaderProps
 * @property {boolean} isPlaying - 音声が再生中かどうかを示すフラグ
 * @property {Function} handlePlayVoice - 音声再生を制御するハンドラー関数
 * @property {string} selectedTab - 現在選択されているタブ名
 * @property {Function} setSelectedTab - タブ選択を更新する関数
 */
interface ProfileHeaderProps {
  isPlaying: boolean;
  handlePlayVoice: () => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

/**
 * プロフィールヘッダーコンポーネント
 * 
 * ユーザープロフィールの上部セクションを表示します。プロフィール画像、名前、
 * 自己紹介文、音声プロフィール再生機能、ショップリンク、統計情報などを含みます。
 * プロフィール編集機能も統合されています。
 * 
 * @param {ProfileHeaderProps} props - コンポーネントのプロパティ
 * @returns {JSX.Element} プロフィールヘッダーコンポーネント
 */
export function ProfileHeader({ isPlaying, handlePlayVoice, selectedTab, setSelectedTab }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [profileData, setProfileData] = useState({
    name: user?.user_name || '名称未設定',
    username: user?.user_name || 'username',
    image: user?.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    bio: user?.introduction || '',
    bioAudioUrl: user?.profile_audio_url || '',
    externalLink: user?.shop_link_url || '',
    pronouns: ''
  });

  /**
   * ユーザー情報が変更されたときにプロフィールデータを更新します
   */
  useEffect(() => {
    if (user) {
      // 開発環境でのモックユーザー対応
      const isDevelopment = import.meta.env.MODE === 'development';
      const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;
      
      if (isDevelopment && testingEmail && user.uid === '12345678') {
        // ローカルストレージからモックユーザープロフィールを取得
        const storedProfile = localStorage.getItem('mockUserProfile');
        if (storedProfile) {
          const mockProfile = JSON.parse(storedProfile);
          setProfileData({
            name: mockProfile.user_name || '名称未設定',
            username: mockProfile.user_name || 'username',
            image: mockProfile.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
            bio: mockProfile.introduction || '',
            bioAudioUrl: mockProfile.profile_audio_url || '',
            externalLink: mockProfile.shop_link_url || '',
            pronouns: ''
          });
          return;
        }
      }
      
      // 通常の処理
      setProfileData({
        name: user.user_name || '名称未設定',
        username: user.user_name || 'username',
        image: user.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        bio: user.introduction || '',
        bioAudioUrl: user.profile_audio_url || '',
        externalLink: user.shop_link_url || '',
        pronouns: ''
      });
    }
  }, [user]);

  /**
   * プロフィール音声の再生/停止を切り替える関数
   */
  const toggleAudio = () => {
    if (!audioRef.current && profileData.bioAudioUrl) {
      audioRef.current = new Audio(profileData.bioAudioUrl);
    }

    if (audioRef.current) {
      if (isAudioPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsAudioPlaying(!isAudioPlaying);
    }
  };

  /**
   * プロフィール更新後の処理を行う関数
   * 
   * プロフィールが更新された後、最新のデータを取得して表示を更新します。
   * 開発環境とプロダクション環境で異なる処理を行います。
   */
  const handleProfileUpdate = () => {
    // プロフィールが更新されたら、最新のデータを取得して表示を更新
    if (user) {
      // 開発環境でのモックユーザー対応
      const isDevelopment = import.meta.env.MODE === 'development';
      const testingEmail = import.meta.env.VITE_TESTING_GOOGLE_MAIL;
      
      if (isDevelopment && testingEmail && user.uid === '12345678') {
        // ローカルストレージからモックユーザープロフィールを取得
        const storedProfile = localStorage.getItem('mockUserProfile');
        if (storedProfile) {
          const mockProfile = JSON.parse(storedProfile);
          setProfileData({
            name: mockProfile.user_name || '名称未設定',
            username: mockProfile.user_name || 'username',
            image: mockProfile.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
            bio: mockProfile.introduction || '',
            bioAudioUrl: mockProfile.profile_audio_url || '',
            externalLink: mockProfile.shop_link_url || '',
            pronouns: ''
          });
        }
      } else {
        // 通常の処理
        const userRef = doc(db, 'users', user.uid);
        getDoc(userRef).then((docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setProfileData({
              name: userData.user_name || '名称未設定',
              username: userData.user_name || 'username',
              image: userData.profile_icon_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
              bio: userData.introduction || '',
              bioAudioUrl: userData.profile_audio_url || '',
              externalLink: userData.shop_link_url || '',
              pronouns: ''
            });
          }
        });
      }
    }
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center gap-8">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={toggleAudio}
          >
            {isAudioPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
            <span className="sr-only">音声を再生</span>
          </Button>

          <Avatar className="h-24 w-24">
            <AvatarImage src={profileData.image} />
            <AvatarFallback>{profileData.name[0] || 'UN'}</AvatarFallback>
          </Avatar>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/shop")}
          >
            <Store className="h-6 w-6" />
            <span className="sr-only">ショップ</span>
          </Button>
        </div>

        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold">{profileData.name}</h1>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <Settings className="h-4 w-4" />
              <span className="sr-only">プロフィールを編集</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">@{profileData.username}</p>
          <p className="text-sm text-muted-foreground">ID: {user?.user_id || '123456789'}</p>
          <p className="text-muted-foreground max-w-md">
            {profileData.bio}
          </p>
        </div>

        <div className="flex gap-8 border rounded-lg p-4 w-full max-w-md justify-between">
          <div className="text-center">
            <div className="font-bold">1.2k</div>
            <div className="text-sm text-muted-foreground">ファミリー</div>
          </div>
          <div className="text-center">
            <div className="font-bold">890</div>
            <div className="text-sm text-muted-foreground">ウォッチ</div>
          </div>
          <div className="text-center">
            <div className="font-bold">3.4k</div>
            <div className="text-sm text-muted-foreground">フォロー</div>
          </div>
          <div className="text-center">
            <div className="font-bold">2.1k</div>
            <div className="text-sm text-muted-foreground">フォロワー</div>
          </div>
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md p-0">
          <ProfileEditForm
            profile={profileData}
            onSubmit={handleProfileUpdate}
            onCancel={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

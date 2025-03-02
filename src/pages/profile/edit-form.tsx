import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Mic, Square, Play, Pause, ChevronRight, RefreshCw } from 'lucide-react';
import { DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { uploadImage, uploadAudio } from '@/lib/storage';
import { updateUserProfile } from '@/lib/firebase';

interface ProfileEditFormProps {
  profile: {
    name: string;
    username: string;
    image: string;
    bio: string;
    bioAudioUrl: string;
    externalLink?: string;
    pronouns?: string;
  };
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ProfileEditForm({ profile, onSubmit, onCancel }: ProfileEditFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState(profile.name);
  const [username, setUsername] = useState(profile.username);
  const [bio, setBio] = useState(profile.bio);
  const [externalLink, setExternalLink] = useState(profile.externalLink || '');
  const [imagePreview, setImagePreview] = useState(profile.image);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(profile.bioAudioUrl);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gender, setGender] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [showRecordingUI, setShowRecordingUI] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ファイルサイズのバリデーション (5MB以下)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: '画像サイズは5MB以下にしてください' }));
        return;
      }
      
      // ファイルタイプのバリデーション
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, image: '対応していないファイル形式です。JPEG、PNG、GIF、WebPのみ対応しています。' }));
        return;
      }
      
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(audioUrl);
        
        // BlobからFileオブジェクトを作成
        const audioFile = new File([audioBlob], `voice-${Date.now()}.wav`, { type: 'audio/wav' });
        setAudioFile(audioFile);
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('録音の開始に失敗しました:', error);
      setErrors(prev => ({ ...prev, audio: '録音の開始に失敗しました。マイクへのアクセスを許可してください。' }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = () => {
    if (audioElementRef.current && audioUrl) {
      if (isPlaying) {
        audioElementRef.current.pause();
      } else {
        audioElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = '名前を入力してください';
    } else if (name.length > 50) {
      newErrors.name = '名前は50文字以内で入力してください';
    }
    
    if (!bio.trim()) {
      newErrors.bio = '自己紹介を入力してください';
    } else if (bio.length > 280) {
      newErrors.bio = '自己紹介は280文字以内で入力してください';
    }
    
    if (externalLink && !externalLink.startsWith('http://') && !externalLink.startsWith('https://')) {
      newErrors.externalLink = '有効なURLを入力してください（http://またはhttps://で始まる必要があります）';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const updateAudio = () => {
    if (window.confirm('本当に更新しますか？')) {
      // 音声の更新処理
      console.log('音声を更新します');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 画像のアップロード処理
      let profileIconUrl = profile.image;
      if (imageFile) {
        profileIconUrl = await uploadImage(imageFile);
      }
      
      // 音声のアップロード処理
      let profileAudioUrl = profile.bioAudioUrl;
      if (audioFile) {
        profileAudioUrl = await uploadAudio(audioFile);
      }
      
      // ユーザープロファイルの更新
      if (user) {
        await updateUserProfile(user.uid, {
          user_name: name,
          profile_icon_url: profileIconUrl,
          profile_audio_url: profileAudioUrl,
          shop_link_url: externalLink,
          is_shop_link: externalLink.includes('shop'),
          introduction: bio
        });
      }
      
      onSubmit();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      setErrors(prev => ({ ...prev, submit: 'プロフィールの更新に失敗しました。もう一度お試しください。' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ヘッダー */}
      <DialogHeader className="border-b px-4 py-3">
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            className="text-base font-normal hover:bg-transparent"
            onClick={onCancel}
          >
            キャンセル
          </Button>
          <DialogTitle className="text-lg font-semibold">
            プロフィールを編集
          </DialogTitle>
          <Button
            variant="ghost"
            className="text-blue-500 text-base font-normal hover:bg-transparent"
            onClick={handleSubmit}
          >
            完了
          </Button>
        </div>
        <DialogDescription className="sr-only">
          プロフィール情報の編集フォーム
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-auto">
        <div className="p-4 space-y-8">
          {/* プロフィール画像 */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={imagePreview} />
              <AvatarFallback>{name[0]}</AvatarFallback>
            </Avatar>
            <Button
              type="button"
              variant="link"
              className="text-blue-500 font-normal"
              onClick={() => fileInputRef.current?.click()}
            >
              写真やアバターを変更
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* 名前とユーザーネーム */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">名前</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="border-0 border-b rounded-none focus-visible:ring-0 px-0"
                placeholder="名前を入力"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">ユーザーネーム</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={15}
                className="border-0 border-b rounded-none focus-visible:ring-0 px-0"
                placeholder="@username"
              />
            </div>
          </div>

          {/* 性別 */}
          <div className="space-y-2">
            <Label htmlFor="gender">性別</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger
                id="gender"
                className="border-0 border-b rounded-none focus:ring-0 px-0"
              >
                <SelectValue placeholder="性別を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">男性</SelectItem>
                <SelectItem value="female">女性</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自己紹介文 */}
          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={280}
              className="min-h-[100px] border-0 border-b rounded-none focus-visible:ring-0 resize-none px-0"
              placeholder="自己紹介を入力してください"
            />
            <p className="text-sm text-muted-foreground text-right">
              {bio.length}/280文字
            </p>
          </div>

          {/* リンク */}
          <div className="space-y-2">
            <Label htmlFor="external-link">リンク</Label>
            <div className="relative border-b">
              <Input
                id="external-link"
                type="url"
                value={externalLink}
                onChange={(e) => setExternalLink(e.target.value)}
                placeholder="リンクを追加"
                className="border-0 focus-visible:ring-0 pr-8 px-0"
              />
              <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* 自己紹介音声 */}
          <div className="space-y-4">
            <Label>自己紹介音声</Label>
            <div className="flex flex-col items-center space-y-4">
              {showRecordingUI ? (
                <div className="flex flex-col items-center space-y-4">
                  <Button
                    type="button"
                    size="lg"
                    variant={isRecording ? 'destructive' : 'default'}
                    className="w-16 h-16 rounded-full"
                    onClick={isRecording ? stopRecording : startRecording}
                  >
                    {isRecording ? (
                      <Square className="h-6 w-6" />
                    ) : (
                      <Mic className="h-6 w-6" />
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isRecording ? '録音中...' : '録音を開始'}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4 w-full">
                  {audioUrl ? (
                    <div className="flex flex-col items-center space-y-4 w-full">
                      <Button
                        type="button"
                        size="lg"
                        variant="outline"
                        className="w-16 h-16 rounded-full"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6" />
                        )}
                      </Button>
                      <div className="flex space-x-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRecordingUI(true)}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          再録音
                        </Button>
                        <Button
                          type="button"
                          variant="default"
                          onClick={updateAudio}
                        >
                          更新
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="default"
                      onClick={() => setShowRecordingUI(true)}
                    >
                      <Mic className="h-4 w-4 mr-2" />
                      録音する
                    </Button>
                  )}
                </div>
              )}
            </div>

            {errors.audio && (
              <p className="text-sm text-red-500 mt-1 text-center">{errors.audio}</p>
            )}

            {audioUrl && (
              <audio
                ref={audioElementRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

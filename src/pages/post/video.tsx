import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Video as VideoIcon, Upload, Play, Pause, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadVideo, YouTubeUploadError } from '@/lib/youtube';
import { auth } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function VideoPostPage() {
  const navigate = useNavigate();
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // エラーメッセージをクリアする
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      videoChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        videoChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoBlob(videoBlob);
        setVideoUrl(videoUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('録画の開始に失敗しました:', error);
      setError('録画の開始に失敗しました。カメラとマイクへのアクセスを許可してください。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoBlob(file);
      setVideoUrl(url);
    }
  };

  const togglePlayback = () => {
    if (videoElementRef.current) {
      if (isPlaying) {
        videoElementRef.current.pause();
      } else {
        videoElementRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSubmit = async () => {
    if (!videoBlob) {
      setError('動画を録画または選択してください。');
      return;
    }

    if (!auth.currentUser) {
      setError('ログインが必要です。');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // YouTubeに動画をアップロード
      const embedUrl = await uploadVideo(videoBlob, {
        title: `動画投稿 ${new Date().toLocaleString('ja-JP')}`,
        description: description,
        isPublic: isPublic
      });

      // Firestoreに投稿データを保存
      const post = {
        userId: auth.currentUser.uid,
        content: embedUrl,
        caption: description,
        mediaType: 'video' as const,
        visibility: isPublic ? 'public' : 'unlisted' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'posts'), post);

      // ホーム画面に遷移
      navigate('/');
    } catch (error) {
      console.error('動画投稿エラー:', error);
      if (error instanceof YouTubeUploadError) {
        setError(error.message);
      } else {
        setError('動画の投稿に失敗しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-16">
      <div className="container mx-auto px-4">
        {/* ヘッダー */}
        <div className="sticky top-16 bg-gray-50 py-4 z-10 flex items-center justify-between border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/post')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">動画投稿</h1>
          <Button
            onClick={handleSubmit}
            disabled={!videoBlob || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                投稿中...
              </>
            ) : (
              '投稿する'
            )}
          </Button>
        </div>

        <div className="py-6 space-y-6">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          {/* 公開設定 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="public-switch">公開設定</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="public-switch" className="text-sm text-gray-500">
                {isPublic ? '公開' : '限定公開'}
              </Label>
              <Switch
                id="public-switch"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          {/* 動画プレビュー/録画 */}
          <div className="space-y-4">
            {isRecording && streamRef.current && (
              <video
                ref={videoElementRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video rounded-lg bg-black"
                // @ts-ignore - srcObject is not in the type definitions but is a valid property
                srcObject={streamRef.current}
              />
            )}
            
            {videoUrl && !isRecording && (
              <div className="relative">
                <video
                  ref={videoElementRef}
                  src={videoUrl}
                  className="w-full aspect-video rounded-lg bg-black"
                  onClick={togglePlayback}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-4 right-4"
                  onClick={togglePlayback}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {!videoUrl && !isRecording && (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center space-y-4">
                  <VideoIcon className="h-12 w-12 text-gray-400 mx-auto" />
                  <div className="space-x-4">
                    <Button
                      variant="outline"
                      onClick={startRecording}
                    >
                      録画を開始
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      動画を選択
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {isRecording && (
              <div className="flex justify-center">
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                >
                  録画を停止
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* 説明文入力 */}
          <div className="space-y-2">
            <Label htmlFor="description">説明文</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="説明文を入力（任意）"
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}  
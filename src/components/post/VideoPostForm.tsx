import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Video as VideoIcon, Upload, Play, Pause } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface VideoPostFormProps {
  onSubmit: (videoFile: File, description: string, isPublic: boolean) => Promise<void>;
}

export function VideoPostForm({ onSubmit }: VideoPostFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'completed' | 'error'>('idle');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // アップロード進捗のシミュレーション用タイマー
  const progressTimerRef = useRef<number | null>(null);

  // アップロード進捗のシミュレーション
  const simulateUploadProgress = () => {
    setUploadProgress(0);
    setUploadStatus('uploading');
    
    let progress = 0;
    progressTimerRef.current = window.setInterval(() => {
      progress += Math.random() * 10;
      if (progress >= 100) {
        progress = 100;
        setUploadProgress(100);
        setUploadStatus('processing');
        clearInterval(progressTimerRef.current as number);
        
        // YouTubeでの処理時間をシミュレート
        setTimeout(() => {
          setUploadStatus('completed');
        }, 1000);
      } else {
        setUploadProgress(Math.min(progress, 99)); // 処理中は99%まで
      }
    }, 500);
  };

  // コンポーネントのアンマウント時にタイマーをクリア
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

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
        const file = new File([videoBlob], `record-${Date.now()}.webm`, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(videoBlob);
        setVideoFile(file);
        setVideoUrl(videoUrl);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('録画の開始に失敗しました:', error);
      alert('録画の開始に失敗しました。カメラとマイクへのアクセスを許可してください。');
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
      setVideoFile(file);
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

  const loadTestVideo = async () => {
    try {
      // テスト用の動画ファイルをフェッチ
      const response = await fetch('/movie.mov');
      const blob = await response.blob();
      
      // Fileオブジェクトに変換
      const file = new File([blob], 'movie.mov', { type: 'video/quicktime' });
      
      // 状態を更新
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setDescription('テスト用動画投稿');
      
      console.log('テスト用動画を読み込みました');
    } catch (error) {
      console.error('テスト用動画の読み込みに失敗しました:', error);
    }
  };

  // テストモード検出
  useEffect(() => {
    // URLにtest=trueパラメータがある場合、自動的にテスト動画を読み込む
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('test') === 'true') {
      setIsTestMode(true);
      loadTestVideo();
    }
  }, []);

  const handleSubmit = async () => {
    if (!videoFile) {
      alert('動画を録画または選択してください。');
      return;
    }

    setIsSubmitting(true);
    simulateUploadProgress(); // アップロード進捗のシミュレーションを開始
    
    try {
      await onSubmit(videoFile, description, isPublic);
      // 送信完了後のリセットは、アップロード完了後に行うように変更
    } catch (error) {
      console.error('動画投稿に失敗しました:', error);
      setUploadStatus('error');
      clearInterval(progressTimerRef.current as number);
    } finally {
      setIsSubmitting(false);
    }
  };

  // アップロード完了後にフォームをリセット
  useEffect(() => {
    if (uploadStatus === 'completed') {
      setTimeout(() => {
        setVideoFile(null);
        setVideoUrl(null);
        setDescription('');
        setIsPlaying(false);
        setUploadProgress(0);
        setUploadStatus('idle');
      }, 2000); // 完了状態を少し表示してからリセット
    }
  }, [uploadStatus]);

  return (
    <div className="space-y-6">
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

      {/* アップロード進捗表示 */}
      {uploadStatus !== 'idle' && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {uploadStatus === 'uploading' && '動画をアップロード中...'}
              {uploadStatus === 'processing' && 'YouTube処理中...'}
              {uploadStatus === 'completed' && 'アップロード完了！'}
              {uploadStatus === 'error' && 'アップロードエラー'}
            </span>
            <span className="text-sm text-gray-500">{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="w-full" />
        </div>
      )}

      {/* 動画プレビュー/録画 */}
      {uploadStatus === 'idle' && (
        <div className="space-y-4">
          {isRecording && streamRef.current && (
            <video
              ref={videoElementRef}
              autoPlay
              muted
              playsInline
              className="w-full aspect-video rounded-lg bg-black"
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
                  <Button
                    variant="outline"
                    onClick={loadTestVideo}
                  >
                    テスト動画を使用
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
      )}

      {/* 説明文入力 */}
      {uploadStatus === 'idle' && (
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
      )}
      
      {uploadStatus === 'idle' ? (
        <Button
          onClick={handleSubmit}
          disabled={!videoFile || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? '送信中...' : '投稿する'}
        </Button>
      ) : uploadStatus === 'error' ? (
        <Button
          onClick={handleSubmit}
          variant="destructive"
          className="w-full"
        >
          再試行
        </Button>
      ) : null}
    </div>
  );
} 
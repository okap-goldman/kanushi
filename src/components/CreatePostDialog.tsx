import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Image, Video, Mic, BookText, History, Users, MapPin, Smile, Camera, Palette, Loader2 } from "lucide-react";
import { uploadFile, uploadAudioBlob, savePost } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface CreatePostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostDialog({ isOpen, onClose }: CreatePostDialogProps) {
  const [postContent, setPostContent] = useState<string>("");
  const [selectedTab, setSelectedTab] = useState<string>("compose");
  const [selectedImages, setSelectedImages] = useState<Array<{url: string, type: string, isVideo: boolean}>>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([
    "瞑想", "スピリチュアル", "マインドフルネス", "ヒーリング",
    "心の成長", "ヨガ", "エネルギーワーク", "タロット", "自己啓発", "自然"
  ]);
  
  // ファイルをアップロードするための状態
  const [selectedImageFiles, setSelectedImageFiles] = useState<File[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // アップロード済みのファイルURL
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const postTypes = [
    { icon: Image, label: "写真・動画", value: "media" },
    { icon: Mic, label: "音声", value: "audio" },
    { icon: MapPin, label: "チェックイン", value: "location" },
    { icon: BookText, label: "タグ付け", value: "addTags" },
  ];

  const handlePostTypeSelect = (type: string) => {
    if (type === "media") {
      fileInputRef.current?.click();
    } else if (type === "audio") {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    } else if (type === "addTags") {
      setSelectedTab("tags");
    } else {
      console.log("Selected post type:", type);
    }
  };
  
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };
  
  const handleTagSelect = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };
  
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const [recordingTimer, setRecordingTimer] = useState<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  const startRecording = async () => {
    // 現在録音中なら何もしない
    if (isRecording) return;
    
    // 前回の録音状態をリセット
    if (mediaRecorderRef.current) {
      try {
        const oldState = mediaRecorderRef.current.state;
        console.log('Previous recorder state:', oldState);
        
        if (oldState === 'recording') {
          mediaRecorderRef.current.stop();
        }
        
        const oldStream = mediaRecorderRef.current.stream;
        if (oldStream) {
          oldStream.getTracks().forEach(track => track.stop());
        }
      } catch (err) {
        console.error('Error cleaning previous recorder:', err);
      }
      mediaRecorderRef.current = null;
    }
    
    // タイマーをクリア
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    try {
      console.log('Starting recording...');
      audioChunksRef.current = []; // 録音データをリセット
      setRecordingTimer(0); // タイマーをリセット

      // マイクへのアクセスを要求
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // MediaRecorderの設定 - オーディオフォーマットを指定
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      
      // データが利用可能になったときのイベントハンドラ
      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 録音停止時のイベントハンドラ
      mediaRecorder.onstop = () => {
        console.log('Recording stopped with', audioChunksRef.current.length, 'chunks');
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioUrl(audioUrl);
          setAudioBlob(audioBlob);
        }
        
        // タイマーを停止
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        
        // ストリームのトラックを停止
        stream.getTracks().forEach(track => track.stop());
      };

      // 録音時間を計測するタイマーを開始
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTimer(prev => prev + 1);
      }, 1000);

      // 録音開始 - 100ミリ秒ごとにデータを取得
      mediaRecorder.start(100);
      setIsRecording(true);
      
      console.log('Recording started with format:', options.mimeType);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      setIsRecording(false);
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording, state:', isRecording, mediaRecorderRef.current?.state);
    
    // 録音中かつMediaRecorderが存在する場合のみ停止処理を実行
    if (mediaRecorderRef.current && isRecording) {
      try {
        // MediaRecorderの状態を確認してから停止
        if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
          console.log('Stopping recorder...');
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.error('Error stopping recorder:', err);
      }
      
      // 状態を即度更新
      setIsRecording(false);
      
      // タイマーを停止
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };
  
  // コンポーネントのアンマウント時にリソースをクリーンアップ
  useEffect(() => {
    return () => {
      // 録音中であればマイクを停止
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
          const stream = mediaRecorderRef.current.stream;
          if (stream) {
            stream.getTracks().forEach(track => track.stop());
          }
        } catch (err) {
          console.error('Error cleaning up media recorder:', err);
        }
      }
      
      // タイマーをクリア
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileList = Array.from(files);
      const newImages = fileList.map(file => {
        const url = URL.createObjectURL(file);
        // Return an object with url and file type info
        return {
          url,
          type: file.type,
          isVideo: file.type.startsWith('video/')
        };
      });
      
      setSelectedImageFiles([...selectedImageFiles, ...fileList]); // 実際のFileオブジェクトを保存
      setSelectedImages([...selectedImages, ...newImages]); // プレビュー用のURL（オブジェクト形式）
      setSelectedTab("preview");
    }
  };

  const handleSubmitPost = async () => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // 画像・動画ファイルのアップロード
      const uploadedUrls: string[] = [];
      if (selectedImageFiles.length > 0) {
        const totalFiles = selectedImageFiles.length;
        
        for (let i = 0; i < selectedImageFiles.length; i++) {
          const file = selectedImageFiles[i];
          const { url, error } = await uploadFile(file);
          
          if (error) throw error;
          if (url) uploadedUrls.push(url);
          
          // 進捗を更新
          setUploadProgress(Math.round(((i + 1) / totalFiles) * 100));
        }
        
        setUploadedImageUrls(uploadedUrls);
      }
      
      // 音声ファイルのアップロード
      let audioFileUrl = null;
      if (audioBlob) {
        const { url, error } = await uploadAudioBlob(audioBlob);
        if (error) throw error;
        if (url) {
          audioFileUrl = url;
          setUploadedAudioUrl(url);
        }
      }
      
      // 投稿タイプを決定
      let contentType = "text";
      if (uploadedUrls.length > 0 && audioFileUrl) {
        contentType = "mixed";
      } else if (uploadedUrls.length > 0) {
        contentType = "image";
      } else if (audioFileUrl) {
        contentType = "audio";
      }
      
      // 投稿データを保存
      const { success, error, data } = await savePost({
        user_id: "temp-user-id", // 実際の実装ではユーザー認証システムから取得
        content_type: contentType,
        text_content: postContent,
        media_url: uploadedUrls.length > 0 ? uploadedUrls : null,
        audio_url: audioFileUrl,
        thumbnail_url: uploadedUrls.length > 0 ? uploadedUrls[0] : null,
        tags: tags.length > 0 ? tags : undefined
      });
      
      if (!success || error) {
        throw error || new Error("投稿の保存に失敗しました");
      }
      
      toast({
        title: "投稿が完了しました",
        description: "メディアファイルのアップロードに成功しました。"
      });
      
      // 状態をリセット
      setPostContent("");
      setSelectedImages([]);
      setSelectedImageFiles([]);
      setAudioUrl(null);
      setAudioBlob(null);
      setUploadedImageUrls([]);
      setUploadedAudioUrl(null);
      setTags([]);
      setTagInput("");
      setSelectedTab("compose");
      
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "エラーが発生しました",
        description: "アップロード中にエラーが発生しました。再度お試しください。",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>投稿を作成</DialogTitle>
        </DialogHeader>
        
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <img src="/placeholder.svg" alt="User" />
            </Avatar>
            <div className="flex flex-col">
              <span className="font-bold">Pocket UI</span>
            </div>
          </div>
          
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsContent value="compose" className="pt-2">
            <Textarea 
              placeholder="その気持ち、シェアしよう" 
              className="min-h-[120px] resize-none border-none text-lg focus-visible:ring-0 p-0"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
            />
            
            {selectedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {selectedImages.map((media, idx) => (
                  <div key={idx} className="relative aspect-square rounded-md overflow-hidden">
                    {media.isVideo ? (
                      <video 
                        src={media.url} 
                        className="w-full h-full object-cover" 
                        controls
                      />
                    ) : (
                      <img src={media.url} className="w-full h-full object-cover" alt={`Selected ${idx}`} />
                    )}
                    {media.isVideo && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        <Video className="h-3 w-3 inline mr-1" />
                        動画
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {audioUrl && (
              <div className="mt-4 p-3 border rounded-md">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  <span>音声ファイル</span>
                </div>
                <audio 
                  className="w-full mt-2" 
                  controls 
                  src={audioUrl} 
                />
              </div>
            )}
            
            {tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-1 bg-slate-100 text-primary text-xs rounded-full flex items-center"
                  >
                    #{tag}
                    <button 
                      className="ml-1 hover:text-red-500"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="preview" className="pt-2">
            <div className="grid grid-cols-3 gap-1">
              {selectedImages.length > 0 ? (
                selectedImages.map((media, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded relative overflow-hidden">
                    {media.isVideo ? (
                      <video 
                        src={media.url} 
                        className="w-full h-full object-cover" 
                        controls
                      />
                    ) : (
                      <img src={media.url} className="w-full h-full object-cover" alt={`Selected ${idx}`} />
                    )}
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-primary" />
                    </div>
                    {media.isVideo && (
                      <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        <Video className="h-3 w-3 inline mr-1" />
                        動画
                      </div>
                    )}
                  </div>
                ))
              ) : (
                Array.from({ length: 12 }).map((_, idx) => (
                  <div key={idx} className="aspect-square bg-gray-100 rounded relative">
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-white/80 flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-gray-400" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="tags" className="pt-2">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">タグを追加</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="新しいタグを入力"
                    className="flex-1 px-3 py-1 border rounded-md text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  />
                  <Button size="sm" onClick={handleAddTag}>追加</Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">おすすめタグ</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags.map((tag) => (
                    <button
                      key={tag}
                      className={`px-3 py-1 text-xs rounded-full ${
                        tags.includes(tag) 
                          ? 'bg-primary text-white' 
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                      onClick={() => handleTagSelect(tag)}
                      disabled={tags.includes(tag)}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">選択したタグ</h3>
                <div className="flex flex-wrap gap-2">
                  {tags.length > 0 ? (
                    tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 bg-primary text-white text-xs rounded-full flex items-center"
                      >
                        #{tag}
                        <button 
                          className="ml-2 text-white hover:text-red-200"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">タグが選択されていません</p>
                  )}
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedTab("compose")}
                >
                  完了
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileChange}
          accept="image/*,video/*" 
          multiple
        />
        
        <div className="border-t mt-4 pt-4">
          <div className="grid grid-cols-3 gap-y-4">
            {postTypes.map(({ icon: Icon, label, value }) => (
              <Button
                key={value}
                variant={value === "audio" && isRecording ? "destructive" : "ghost"}
                className="flex flex-col items-center gap-1 h-auto py-2"
                onClick={() => handlePostTypeSelect(value)}
              >
                <Icon className={`h-6 w-6 ${value === "audio" && isRecording ? "animate-pulse" : "text-primary"}`} />
                <span className="text-xs">
                  {value === "audio" && isRecording 
                    ? `録音中... ${Math.floor(recordingTimer / 60)}:${(recordingTimer % 60).toString().padStart(2, '0')}` 
                    : label}
                </span>
              </Button>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Button 
            onClick={handleSubmitPost} 
            disabled={(!postContent && selectedImages.length === 0 && !audioUrl) || isUploading}
            className="relative"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                アップロード中... {uploadProgress > 0 ? `${uploadProgress}%` : ''}
              </>
            ) : (
              "投稿する"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
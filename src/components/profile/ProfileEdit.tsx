import { useState, useRef } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Pause, Save, ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";

export function ProfileEdit() {
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState<string>("https://api.dicebear.com/7.x/avataaars/svg?seed=1");
  const [name, setName] = useState<string>("心の探求者");
  const [username, setUsername] = useState<string>("seeker_of_heart");
  const [userId, setUserId] = useState<string>("123456789");
  const [bio, setBio] = useState<string>("地球での使命：人々の心に光を灯し、内なる平安への道を示すこと");
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle avatar file upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setAvatar(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Start recording voice
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Release microphone access
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("マイクへのアクセスが許可されていません。ブラウザの設定を確認してください。");
    }
  };

  // Stop recording voice
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play recorded audio
  const playRecordedAudio = () => {
    if (recordedAudio) {
      if (!audioRef.current) {
        audioRef.current = new Audio(recordedAudio);
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      } else {
        audioRef.current.src = recordedAudio;
      }

      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }
  };

  // Save profile changes
  const saveProfile = () => {
    // Here you would typically send data to the backend
    // For now, we'll just navigate back to the profile
    alert("プロフィールが保存されました");
    navigate("/profile");
  };

  return (
    <div className="container mx-auto px-4 pt-16 pb-24">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate("/profile")}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          戻る
        </Button>
        <h1 className="text-xl font-bold">プロフィール編集</h1>
        <Button onClick={saveProfile}>
          <Save className="h-5 w-5 mr-2" />
          保存
        </Button>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatar} />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <Button 
            size="icon" 
            className="absolute bottom-0 right-0 rounded-full h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleAvatarUpload} 
          />
        </div>

        <div className="w-full max-w-md space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="名前を入力" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">ユーザーネーム</Label>
            <Input 
              id="username" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              placeholder="ユーザーネームを入力" 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="userId">ユーザーID</Label>
            <Input 
              id="userId" 
              value={userId} 
              onChange={(e) => setUserId(e.target.value)} 
              placeholder="ユーザーIDを入力"
              disabled 
            />
            <p className="text-xs text-muted-foreground">ユーザーIDは変更できません</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">自己紹介</Label>
            <Textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="自己紹介を入力"
              rows={4} 
            />
          </div>

          <Card className="p-4">
            <h3 className="font-medium mb-2">自己紹介音声</h3>
            <p className="text-sm text-muted-foreground mb-4">
              プロフィールに表示される自己紹介音声を録音します
            </p>
            
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  variant="outline"
                  onClick={startRecording}
                  disabled={isRecording}
                >
                  <Mic className="h-4 w-4 mr-2" />
                  録音開始
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={stopRecording}
                >
                  <Square className="h-4 w-4 mr-2" />
                  録音停止
                </Button>
              )}
              
              {recordedAudio && (
                <Button
                  variant="outline"
                  onClick={playRecordedAudio}
                  disabled={isRecording}
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4 mr-2" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  {isPlaying ? "再生停止" : "再生"}
                </Button>
              )}
            </div>
            
            {recordedAudio && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground">
                  ✅ 録音済み
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
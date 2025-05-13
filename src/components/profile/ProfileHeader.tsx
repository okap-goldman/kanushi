import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Play, Pause, Store, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";

interface ProfileHeaderProps {
  isPlaying: boolean;
  handlePlayVoice: () => void;
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

export function ProfileHeader({ isPlaying, handlePlayVoice }: ProfileHeaderProps) {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio("https://s328.podbean.com/pb/4b3e15298687315db3070972aaa50fee/676f0aab/data1/fs91/20007750/uploads/6b592.m4a?pbss=abbaab44-f1dd-5725-bf73-452199e42c01");
    }

    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
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
          <AvatarImage src={profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || '1'}`} />
          <AvatarFallback>{profile?.name?.[0] || user?.email?.[0] || 'U'}</AvatarFallback>
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
      
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => navigate("/profile/edit")}
        >
          プロフィールを編集
        </Button>
        
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          ログアウト
        </Button>
      </div>

      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">{profile?.name || user?.email?.split('@')[0]}</h1>
        <p className="text-sm text-muted-foreground">@{profile?.username || 'username'}</p>
        <p className="text-sm text-muted-foreground">ID: {user?.id?.substring(0, 8) || '123456789'}</p>
        <p className="text-muted-foreground max-w-md">
          {profile?.bio || '地球での使命：人々の心に光を灯し、内なる平安への道を示すこと'}
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
  );
}
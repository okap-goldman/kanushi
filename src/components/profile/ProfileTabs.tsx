import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Post } from "@/components/Post";
import { SAMPLE_POSTS } from "@/lib/data";
import { Play, Pause, Flame, Quote } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileTabsProps {
  selectedTab: string;
  setSelectedPost: (post: any) => void;
  setSelectedShopItem?: (item: any) => void;
}

interface AudioPlayerState {
  isPlaying: boolean;
  currentAudioIndex: number;
  continuousPlay: boolean;
}

// Define the post type to match the data structure
type PostType = {
  author: {
    name: string;
    image: string;
    id: string;
  };
  content: string;
  caption?: string;
  mediaType: "text" | "image" | "video" | "audio";
  postId?: string;
  tags?: { id: string; name: string }[];
};

// Define the highlight comment type
type HighlightComment = {
  postId: string;
  text: string;
  date: string;
};

// Format time for audio display
const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export function ProfileTabs({ selectedTab, setSelectedPost }: ProfileTabsProps) {
  // Audio player state
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentAudioIndex: -1,
    continuousPlay: false,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Sample highlight comments (これは後でSupabaseから取得するようにします)
  const [highlightComments, setHighlightComments] = useState<HighlightComment[]>([
    {
      postId: "1",
      text: "この投稿の言葉が心に深く響きました。特に「青梅に来て生まれ変わった」という部分に共感します。環境が変わることで人は本当に変われるのですね。",
      date: "2024年5月10日"
    },
    {
      postId: "2",
      text: "瞑想の音声がとても落ち着きます。毎日の習慣にしたいと思います。",
      date: "2024年5月8日"
    },
    {
      postId: "3",
      text: "美しい風景ですね。私も瞑想する特別な場所を見つけたいと思います。",
      date: "2024年5月5日"
    }
  ]);
  
  // Get all audio posts
  const audioPosts = SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "audio");

  // Handle main play button click
  const handleMainPlayClick = () => {
    if (audioPosts.length === 0) return;
    
    const newIndex = audioState.currentAudioIndex === -1 ? 0 : audioState.currentAudioIndex;
    
    if (audioState.isPlaying) {
      audioRef.current?.pause();
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioPosts[newIndex].content);
        setupAudioEvents();
      }
      audioRef.current.play();
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: true,
        currentAudioIndex: newIndex
      }));
    }
  };

  // Handle individual track play
  const handleTrackPlay = (index: number) => {
    if (audioState.currentAudioIndex === index) {
      // Toggle play/pause on current track
      if (audioState.isPlaying) {
        audioRef.current?.pause();
        setAudioState(prev => ({ ...prev, isPlaying: false }));
      } else {
        audioRef.current?.play();
        setAudioState(prev => ({ ...prev, isPlaying: true }));
      }
    } else {
      // Switch to new track
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioPosts[index].content);
      setupAudioEvents();
      audioRef.current.play();
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: true,
        currentAudioIndex: index 
      }));
    }
  };

  // Setup audio events
  const setupAudioEvents = () => {
    if (!audioRef.current) return;
    
    audioRef.current.addEventListener('timeupdate', updateProgress);
    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });
    audioRef.current.addEventListener('ended', handleAudioEnded);
    
    // Initial duration setup
    if (audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  // Handle audio ended
  const handleAudioEnded = () => {
    if (audioState.continuousPlay && audioState.currentAudioIndex < audioPosts.length - 1) {
      // Play next track
      const nextIndex = audioState.currentAudioIndex + 1;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(audioPosts[nextIndex].content);
      setupAudioEvents();
      audioRef.current.play();
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: true,
        currentAudioIndex: nextIndex 
      }));
    } else {
      // Stop playing
      setAudioState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // Update progress
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };
  
  // Handle progress bar change
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>, trackIndex?: number) => {
    if (!audioRef.current) return;
    
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    
    // If we're adjusting progress for a different track than currently playing
    if (trackIndex !== undefined && trackIndex !== audioState.currentAudioIndex) {
      handleTrackPlay(trackIndex);
    }
  };

  // Toggle continuous play
  const toggleContinuousPlay = () => {
    setAudioState(prev => ({ ...prev, continuousPlay: !prev.continuousPlay }));
  };

  // Clean up audio when component unmounts
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('timeupdate', updateProgress);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
      }
    };
  }, []);
  return (
    <Tabs defaultValue={selectedTab} className="mt-8">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="media">メディア</TabsTrigger>
        <TabsTrigger value="audio">音声</TabsTrigger>
        <TabsTrigger value="text">テキスト</TabsTrigger>
        <TabsTrigger value="highlights">ハイライト</TabsTrigger>
        <TabsTrigger value="events">イベント</TabsTrigger>
      </TabsList>

      <TabsContent value="media" className="mt-4">
        <div className="grid grid-cols-3 gap-1">
          {SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "image").map((post, index) => (
            <Card 
              key={index} 
              className="aspect-square overflow-hidden cursor-pointer"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.content}
                alt=""
                className="w-full h-full object-cover"
              />
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="audio" className="mt-4">
        <div className="space-y-6">
          {/* Main audio controls */}
          <Card className="p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleMainPlayClick}
                  disabled={audioPosts.length === 0}
                >
                  {audioState.isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-0.5" />
                  )}
                  <span className="sr-only">すべての音声を{audioState.isPlaying ? '一時停止' : '再生'}</span>
                </Button>
                <div className="font-medium">
                  {audioState.currentAudioIndex >= 0 && audioState.isPlaying ? 
                    `再生中: ${audioPosts[audioState.currentAudioIndex].author.name}` : 
                    'すべての音声'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="continuousPlay" 
                  checked={audioState.continuousPlay} 
                  onCheckedChange={toggleContinuousPlay} 
                />
                <label htmlFor="continuousPlay" className="text-sm cursor-pointer">
                  連続再生
                </label>
              </div>
            </div>
          </Card>

          {/* Audio tracks list */}
          <div className="space-y-2">
            {audioPosts.map((post, index) => (
              <Card 
                key={index} 
                className={`p-4 transition-colors ${audioState.currentAudioIndex === index ? 'bg-muted/50' : ''}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleTrackPlay(index)}
                  >
                    {audioState.isPlaying && audioState.currentAudioIndex === index ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                    <span className="sr-only">音声を{audioState.isPlaying && audioState.currentAudioIndex === index ? '一時停止' : '再生'}</span>
                  </Button>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{post.author.name}</div>
                    {post.caption && <div className="text-xs text-muted-foreground truncate">{post.caption}</div>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {audioState.currentAudioIndex === index ? 
                      `${formatTime(currentTime)} / ${formatTime(duration)}` : 
                      '-- / --'}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full">
                  <input 
                    type="range" 
                    min={0} 
                    max={audioState.currentAudioIndex === index ? duration || 100 : 100} 
                    value={audioState.currentAudioIndex === index ? currentTime : 0} 
                    onChange={(e) => handleProgressChange(e, index)}
                    className="w-full h-1.5 accent-primary cursor-pointer" 
                  />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="text" className="mt-4">
        <div className="space-y-4">
          {SAMPLE_POSTS.filter((post: PostType) => post.mediaType === "text").map((post, index) => (
            <div key={index} onClick={() => setSelectedPost(post)}>
              <Post {...post} />
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="highlights" className="mt-4">
        <div className="space-y-6">
          {SAMPLE_POSTS.map((post, index) => {
            // 投稿に対応するハイライトコメントを探す
            const highlightComment = highlightComments.find(comment => comment.postId === String(index + 1));
            
            // ハイライトコメントがある場合のみ表示
            return highlightComment ? (
              <Card key={index} className="overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b">
                  <div className="flex items-start gap-3">
                    <div className="min-w-8 mt-1">
                      <Avatar className="h-8 w-8 border-2 border-orange-200">
                        <AvatarImage src={post.author.image} />
                        <AvatarFallback>{post.author.name[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Quote className="h-4 w-4 text-orange-500" />
                        <p className="text-sm font-medium text-orange-700">
                          私のハイライト
                        </p>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {highlightComment.text}
                      </p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-xs text-muted-foreground">{highlightComment.date}</div>
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                          <span className="text-xs font-medium text-orange-700">ハイライト</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Post 
                    postId={String(index + 1)}
                    key={index} 
                    {...post} 
                  />
                </div>
              </Card>
            ) : null;
          }).filter(Boolean)}
        </div>
      </TabsContent>

      <TabsContent value="events" className="mt-4">
        <Card className="p-4">
          <h3 className="font-medium">瞑想ワークショップ</h3>
          <p className="text-sm text-muted-foreground">2024年4月1日 14:00-16:00</p>
          <p className="mt-2">心の平安を見つける瞑想の基礎を学びましょう。</p>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
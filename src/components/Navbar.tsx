/**
 * ナビゲーションバーモジュール
 * 
 * アプリケーションの上部に固定されたナビゲーションバーを提供します。
 * 新規投稿作成、検索、通知、メッセージ、ユーザーメニューなどの機能へのアクセスを提供します。
 */
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bell, MessageCircle, User, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PlusIcon, SearchIcon, MessageSquareIcon, UserIcon } from "lucide-react";

/**
 * ナビゲーションバーコンポーネント
 * 
 * アプリケーションの上部に表示される固定ナビゲーションバーです。
 * アプリケーション名、各種機能ボタン（投稿作成、検索、通知など）、
 * ユーザー関連の操作（プロフィール表示、ログアウトなど）を提供します。
 * 
 * @returns {JSX.Element} ナビゲーションバーコンポーネント
 */
export function Navbar() {
  const { toast } = useToast();
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * ログアウト処理を行うハンドラー関数
   * 
   * 認証コンテキストのlogout関数を呼び出し、成功時にはトースト通知を表示してログインページへリダイレクトします。
   * 失敗時にはエラーメッセージをトースト通知で表示します。
   */
  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "ログアウトしました",
        description: "ご利用ありがとうございました",
      });
      navigate('/auth/login');
    } catch (error) {
      toast({
        title: "ログアウトに失敗しました",
        description: "もう一度お試しください",
        variant: "destructive",
      });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold">目醒め人SNS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => setIsCreatePostOpen(true)} 
            variant="outline" 
            size="icon"
            aria-label="新規投稿を作成"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => setIsSearchOpen(true)} aria-label="検索">
            <SearchIcon className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => setIsNotificationsOpen(true)} aria-label="通知">
            <Bell className="h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => setIsChatOpen(true)} aria-label="AIチャット">
            <MessageCircle className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(true)} className="relative" aria-label="メニュー">
            <User className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-red-500 hover:text-red-600"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/auth/login')}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              ログイン
            </Button>
          )}
        </div>
      </div>

      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>通知</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} />
                    <AvatarFallback>UN</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm">ユーザー{i}があなたの投稿にいいねしました</p>
                    <p className="text-xs text-muted-foreground">1時間前</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </header>
  );
}
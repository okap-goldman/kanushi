import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Link } from 'react-router-dom';

export function UserAuthStatus() {
  const { user, profile, signOut, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse"></div>
        <div className="h-4 w-24 bg-slate-200 animate-pulse rounded"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center space-x-2">
        <Link to="/login">
          <Button variant="outline" size="sm">ログイン</Button>
        </Link>
        <Link to="/register">
          <Button size="sm">登録</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <Link to="/profile">
        <Avatar>
          <AvatarImage src={profile?.image} alt={profile?.name || "ユーザー"} />
          <AvatarFallback>{profile?.name?.[0] || user.email?.[0]}</AvatarFallback>
        </Avatar>
      </Link>
    </div>
  );
}
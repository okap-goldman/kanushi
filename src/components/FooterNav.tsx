import { Home, Search, PlusSquare, Compass, User, Calendar } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { CreatePostDialog } from "./CreatePostDialog";

export function FooterNav() {
  const location = useLocation();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-around items-center p-3 z-50">
        <Link to="/" className={`${isActive('/') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Home className="w-6 h-6" />
        </Link>
        <Link to="/search" className={`${isActive('/search') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Search className="w-6 h-6" />
        </Link>
        <button 
          onClick={() => setIsCreatePostOpen(true)}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <PlusSquare className="w-6 h-6" />
        </button>
        <Link to="/discover" className={`${isActive('/discover') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Compass className="w-6 h-6" />
        </Link>
        <Link to="/events" className={`${isActive('/events') ? 'text-primary' : 'text-muted-foreground'}`}>
          <Calendar className="w-6 h-6" />
        </Link>
        <Link to="/profile" className={`${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
          <User className="w-6 h-6" />
        </Link>
      </nav>

      <CreatePostDialog 
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </>
  );
}
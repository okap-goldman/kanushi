import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { IS_DEV } from '@/lib/env';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading } = useAuth();

  // In development mode, skip authentication check if VITE_SKIP_LOGIN is enabled
  if (IS_DEV && (import.meta.env.VITE_SKIP_LOGIN === 'true' || import.meta.env.VITE_SKIP_LOGIN === true)) {
    return children ? <>{children}</> : <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { IS_DEV } from "./lib/env";
import { useState } from "react";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Search from "./pages/Search";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import MessageDetail from "./pages/MessageDetail";
import NewMessage from "./pages/NewMessage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { FooterNav } from "./components/FooterNav";
import { SplashScreen } from "./components/SplashScreen";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

function AppContent() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // In development mode with SKIP_LOGIN, we never treat auth pages as special
  const skipAuth = IS_DEV && (import.meta.env.VITE_SKIP_LOGIN === 'true' || import.meta.env.VITE_SKIP_LOGIN === true);
  const isAuthPage = skipAuth ? false : (location.pathname === '/login' || location.pathname === '/register');

  return (
    <>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Index />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/search" element={<Search />} />
            <Route path="/discover" element={<Discover />} />
            
            {/* Message Routes */}
            <Route path="/messages" element={<Messages />} />
            <Route path="/messages/new" element={<NewMessage />} />
            <Route path="/messages/:conversationId" element={<MessageDetail />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {!isAuthPage && <FooterNav />}
      </TooltipProvider>
    </>
  );
}

function App() {
  const queryClient = new QueryClient();

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
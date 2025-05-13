import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { IS_DEV } from '@/lib/env';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Skip login in development mode if needed
    console.log('DEV mode:', IS_DEV, 'Skip login:', import.meta.env.VITE_SKIP_LOGIN);
    if (IS_DEV && (import.meta.env.VITE_SKIP_LOGIN === 'true' || import.meta.env.VITE_SKIP_LOGIN === true)) {
      const mockUser = {
        id: 'dev-user-id',
        email: 'dev@example.com',
        // Add other required user properties
      } as User;
      
      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Date.now() + 3600
      } as Session;
      
      setSession(mockSession);
      setUser(mockUser);
      setProfile({
        id: mockUser.id,
        username: 'developer',
        full_name: 'Development User',
        avatar_url: '/placeholder.svg',
        // Add other profile fields as needed
      });
      setIsLoading(false);
      return;
    }
    
    // Normal authentication flow
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    // Skip subscription in dev mode with skip login
    if (IS_DEV && (import.meta.env.VITE_SKIP_LOGIN === 'true' || import.meta.env.VITE_SKIP_LOGIN === true)) {
      return () => {};
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    session,
    user,
    profile,
    isLoading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
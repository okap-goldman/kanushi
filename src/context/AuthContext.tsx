import type { Session, User } from '@supabase/supabase-js';
import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface AuthContextProps {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    username: string
  ) => Promise<{ error: Error | null; user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If logged in, check if profile exists
      if (session?.user) {
        checkAndCreateProfileIfNeeded(session.user);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // If this is a sign-in event and we have a user, check if profile exists
      if (event === 'SIGNED_IN' && session?.user) {
        await checkAndCreateProfileIfNeeded(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Helper to check if profile exists and create one if needed
  const checkAndCreateProfileIfNeeded = async (user: User) => {
    try {
      // Check if profile exists
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found"
        console.error('Error checking profile:', error);
        return;
      }

      // If no profile exists, create one
      if (!data) {
        // Get username from metadata or use a default
        const username =
          user.user_metadata?.username ||
          user.email?.split('@')[0] ||
          `user_${Math.random().toString(36).substring(2, 9)}`;

        const { error: profileError } = await supabase.from('profiles').insert({
          id: user.id,
          name: user.user_metadata?.name || username,
          image: user.user_metadata?.image || 'https://via.placeholder.com/150',
          username: username,
          bio: user.user_metadata?.bio || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
    } catch (err) {
      console.error('Profile check/creation error:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // User is signed in and authenticated, now create the profile
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user!.id,
          name: username,
          image: 'https://via.placeholder.com/150',
          username,
          bio: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't throw, since the user was created successfully
        }
      } else {
        // Email confirmation is required - inform in the log
        console.log('Email confirmation required before profile creation');
      }

      return { error: null, user: data.user };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

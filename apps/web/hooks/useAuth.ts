// =============================================================================
// LendTrack :: Auth Context & Hook (Direct Supabase)
// apps/web/hooks/useAuth.ts
// =============================================================================

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient.js';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (body: { full_name?: string; avatar_url?: string; notification_prefs?: any }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (currentUserId: string | undefined) => {
    if (!currentUserId) {
      setProfile(null);
      return;
    }
    try {
      const { data, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .single();

      if (profileErr) {
        throw profileErr;
      }
      setProfile(data);
    } catch (err: any) {
      console.error('[AuthProvider] Failed to fetch profile from Supabase:', err);
      setError(err.message || 'Failed to fetch user profile.');
    }
  };

  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: activeSession } }) => {
      setSession(activeSession);
      const activeUser = activeSession?.user ?? null;
      setUser(activeUser);
      if (activeUser) {
        fetchProfile(activeUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      const activeUser = newSession?.user ?? null;
      setUser(activeUser);
      setError(null);
      
      if (activeUser) {
        setLoading(true);
        await fetchProfile(activeUser.id);
        setLoading(false);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (err) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signOut();
    if (err) {
      setError(err.message);
      throw err;
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const updateProfile = async (body: { full_name?: string; avatar_url?: string; notification_prefs?: any }) => {
    if (!user) throw new Error('Not authenticated.');
    setError(null);
    
    try {
      const { data, error: updateErr } = await supabase
        .from('profiles')
        .update(body)
        .eq('id', user.id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      setProfile(data);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      throw err;
    }
  };

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        session,
        profile,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        updateProfile,
      },
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

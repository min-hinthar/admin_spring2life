'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ProviderProfile, Role, UserProfile } from '../types';
import { supabase } from '../lib/supabaseClient';
import { db } from '../services/dbService';

interface AuthContextType {
  user: UserProfile | ProviderProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loadProfile(userId: string): Promise<UserProfile | ProviderProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    console.error('Profile load failed', error.message);
    return null;
  }
  return data
    ? {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        role: data.role,
        avatarUrl: data.avatar_url ?? undefined,
        timezone: data.timezone ?? undefined,
        bio: data.bio ?? undefined,
        specialty: data.specialty ?? undefined,
        telehealth: data.telehealth ?? undefined,
        hourlyRate: data.hourly_rate ?? undefined,
        isActive: data.is_active ?? undefined,
      }
    : null;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const profile = await loadProfile(sessionUser.id);
        if (profile) setUser(profile);
      }
      setIsLoading(false);
    };
    init();

    const { data: authListener } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    }) ?? { data: null };

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    if (!supabase) {
      const fallbackUser = await db.users.findByEmail(email);
      if (fallbackUser) {
        setUser(fallbackUser);
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      throw new Error('Supabase client is not configured');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    const session = await supabase.auth.getSession();
    const profile = session.data.session?.user ? await loadProfile(session.data.session.user.id) : null;
    setUser(profile);
    setIsLoading(false);
  };

  const register = async (email: string, password: string, fullName: string, role: Role) => {
    setIsLoading(true);
    if (!supabase) {
      const fallbackId = `${role}-${Date.now()}`;
      await db.users.upsertProfile({ id: fallbackId, email, fullName, role });
      const profile = await db.users.getById(fallbackId);
      setUser(profile || null);
      setIsLoading(false);
      return;
    }
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    const userId = data.user?.id;
    if (userId) {
      await db.users.upsertProfile({
        id: userId,
        email,
        fullName,
        role,
      });
      const profile = await loadProfile(userId);
      setUser(profile);
    }
    setIsLoading(false);
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

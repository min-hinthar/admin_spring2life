import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, ProviderProfile, Role } from '../types';
import { db } from '../services/dbService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface AuthContextType {
  user: UserProfile | ProviderProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password?: string, role?: Role) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    const profile = await db.providers.getById(userId) || await db.users.getById(userId);
    if (profile) {
      setUser(profile);
      localStorage.setItem('s2l_session_uid', profile.id);
      localStorage.setItem('s2l_session_role', profile.role);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user;
      if (sessionUser?.id) {
        await loadProfile(sessionUser.id);
      } else {
        const storedId = localStorage.getItem('s2l_session_uid');
        if (storedId) await loadProfile(storedId);
      }
      setIsLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user?.id) {
        await loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const login = async (email: string, password = '', role?: Role) => {
    setIsLoading(true);
    let authUserId = '';
    let authError: Error | null = null;

    if (password || isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      authUserId = data.user?.id || '';
      if (error) authError = error;
    }

    const profile = role === 'provider'
      ? await db.providers.findByEmail(email)
      : await db.users.findByEmail(email) || await db.providers.findByEmail(email || '');

    if (profile) {
      setUser(profile);
      localStorage.setItem('s2l_session_uid', profile.id);
      localStorage.setItem('s2l_session_role', profile.role);
    } else if (authUserId) {
      await loadProfile(authUserId);
    } else if (authError) {
      setIsLoading(false);
      throw authError;
    }
    setIsLoading(false);
  };

  const register = async (email: string, password: string, fullName: string, role: Role) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    const id = data.user?.id || `${role}-${Date.now()}`;
    const baseProfile: UserProfile = {
      id,
      email,
      fullName,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      createdAt: new Date().toISOString()
    };

    if (role === 'provider') {
      const newProvider: ProviderProfile = {
        ...baseProfile,
        specialty: 'General Practitioner',
        bio: 'New provider profile.',
        telehealth: true,
        hourlyRate: 100,
        isActive: true,
        availability: []
      };
      const created = await db.providers.create(newProvider);
      setUser(created);
    } else {
      const created = await db.users.create(baseProfile);
      setUser(created);
    }

    localStorage.setItem('s2l_session_uid', id);
    localStorage.setItem('s2l_session_role', role);
    setIsLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('s2l_session_uid');
    localStorage.removeItem('s2l_session_role');
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

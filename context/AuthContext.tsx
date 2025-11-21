import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ProviderProfile, Role } from '../types';
import { authApi } from '../services/supabaseService';

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

  useEffect(() => {
    const init = async () => {
      try {
        const supabaseUser = await authApi.getSessionUser();
        if (supabaseUser?.id) {
          const profile = await authApi.getProfile(supabaseUser.id);
          if (profile) setUser(profile);
        }
      } catch (error) {
        console.error('Failed to restore session', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async (email: string, password?: string, role?: Role) => {
    setIsLoading(true);
    try {
      const userAuth = await authApi.signIn(email, password || '');
      if (!userAuth?.id) throw new Error('Invalid credentials');
      const profile = await authApi.getProfile(userAuth.id);
      if (!profile) throw new Error('No profile found for this account');

      // If a role is specified, validate it
      if (role && profile.role !== role) {
        throw new Error(`This account is not registered as a ${role}`);
      }

      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string, role: Role) => {
    setIsLoading(true);
    try {
      const userAuth = await authApi.signUp(email, password, fullName, role);
      const profile = await authApi.getProfile(userAuth.id!);
      if (profile) setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await authApi.signOut();
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

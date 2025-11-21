import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, ProviderProfile, Role } from '../types';
import { db } from '../services/dbService';

interface AuthContextType {
  user: UserProfile | ProviderProfile | null;
  isAuthenticated: boolean;
  login: (email: string, role?: Role) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedId = localStorage.getItem('s2l_session_uid');
    const storedRole = localStorage.getItem('s2l_session_role');

    if (storedId && storedRole) {
      const found = storedRole === 'provider' 
        ? db.providers.getById(storedId) 
        : db.users.getById(storedId);
      
      if (found) setUser(found);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, role?: Role) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 600)); // Simulate network

    let found: UserProfile | ProviderProfile | undefined;

    // Try to find in users first, then providers if not specified, or specific
    const userFound = db.users.findByEmail(email);
    const providerFound = db.providers.findByEmail(email);

    if (role === 'provider') found = providerFound;
    else if (role === 'user' || role === 'admin') found = userFound;
    else found = userFound || providerFound; // Auto-detect

    if (found) {
      setUser(found);
      localStorage.setItem('s2l_session_uid', found.id);
      localStorage.setItem('s2l_session_role', found.role);
    } else {
      setIsLoading(false);
      throw new Error('Invalid email or password');
    }
    setIsLoading(false);
  };

  const register = async (email: string, password: string, fullName: string, role: Role) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 800));

    // Check duplicates
    if (db.users.findByEmail(email) || db.providers.findByEmail(email)) {
      setIsLoading(false);
      throw new Error('Email already in use');
    }

    const newUser: UserProfile = {
      id: `${role}-${Date.now()}`,
      email,
      fullName,
      role,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`,
      createdAt: new Date().toISOString()
    };

    if (role === 'provider') {
      const newProvider: ProviderProfile = {
        ...newUser,
        specialty: 'General Practitioner',
        bio: 'New provider profile.',
        telehealth: true,
        hourlyRate: 100,
        isActive: true,
        availability: []
      };
      db.providers.create(newProvider);
      setUser(newProvider);
    } else {
      db.users.create(newUser);
      setUser(newUser);
    }

    localStorage.setItem('s2l_session_uid', newUser.id);
    localStorage.setItem('s2l_session_role', role);
    setIsLoading(false);
  };

  const logout = () => {
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

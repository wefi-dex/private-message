import { createUser as apiCreateUser, login as apiLogin } from '@/utils/api';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  photo?: string;
  avatar?: string | null; // Now a string URL or null
  alias?: string;
}

interface AuthContextProps {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, username: string, role: 'creator' | 'fan', alias?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  registeredUsernames: string[];
  updateUserContext: (newUserData: Partial<User>) => void; // Add this line for updateUserContext
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [registeredUsernames, setRegisteredUsernames] = useState<string[]>([]);

  const login = async (username: string, password: string) => {
    try {
      const res = await apiLogin(username, password);
      // avatar is now a string or null
      setUser(res.user || res);
      setToken(res.token); // Save the token
      return true;
    } catch (e) {
      return false;
    }
  };

  const register = async (email: string, password: string, username: string, role: 'creator' | 'fan', alias?: string) => {
    try {
      const res = await apiCreateUser({ email, password, username, role, alias });
      // avatar is now a string or null
      setUser(res.user || res);
      setToken(res.token); // Save the token if returned
      return { ok: true };
    } catch (e: any) {
      const msg = e.message || 'Registration failed';
      if (msg.toLowerCase().includes('username') && msg.toLowerCase().includes('duplicate')) {
        return { ok: false, error: 'Username is already taken.' };
      }
      return { ok: false, error: msg };
    }
  };

  // Add a function to update user in context after profile update
  const updateUserContext = (newUserData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...newUserData } : prev);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, registeredUsernames, updateUserContext }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
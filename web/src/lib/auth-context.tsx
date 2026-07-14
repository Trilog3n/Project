'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, setTokens, clearTokens } from './api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<User>;
  registerVendor: (data: Record<string, unknown>) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const handleAuthResponse = useCallback((data: { user: User; tokens: { accessToken: string; refreshToken: string } }) => {
    setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password) as { user: User; tokens: { accessToken: string; refreshToken: string } };
    return handleAuthResponse(data);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }) => {
    const res = await authApi.register(data) as { user: User; tokens: { accessToken: string; refreshToken: string } };
    return handleAuthResponse(res);
  };

  const registerVendor = async (data: Record<string, unknown>) => {
    const res = await authApi.registerVendor(data) as { user: User; tokens: { accessToken: string; refreshToken: string } };
    return handleAuthResponse(res);
  };

  const logout = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerVendor,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

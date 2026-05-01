'use client';
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { User, AuthResponse } from '@/src/types';
import { authAPI } from '@/src/app/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token management utilities
const TokenManager = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },
  
  setToken: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },
  
  removeToken: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('token_expiry');
  },
  
  setTokenWithExpiry: (token: string, expiresIn: number = 24 * 60 * 60 * 1000): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    localStorage.setItem('token_expiry', (Date.now() + expiresIn).toString());
  },
  
  isTokenExpired: (): boolean => {
    if (typeof window === 'undefined') return true;
    const expiry = localStorage.getItem('token_expiry');
    return expiry ? Date.now() > parseInt(expiry) : false;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const token = TokenManager.getToken();
      
      if (!token || TokenManager.isTokenExpired()) {
        TokenManager.removeToken();
        setUser(null);
        setIsAuthenticated(false);
        return;
      }

      const userData = await authAPI.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Auth check failed:', error);
      TokenManager.removeToken();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.login(email, password);
      TokenManager.setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      // Re-throw the error to be handled by the component
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: string) => {
    try {
      setLoading(true);
      const response: AuthResponse = await authAPI.register(name, email, password, role);
      TokenManager.setToken(response.token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    TokenManager.removeToken();
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear any cached data
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
    }
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...userData } : null);
  }, []);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    updateUser,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
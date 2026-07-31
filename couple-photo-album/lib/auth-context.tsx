'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'anh' | 'em';
  profileImageUrl?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithPasscode: (passcode: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load from cookie on mount and validate session
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = Cookies.get('authToken');
        if (savedToken) {
          // Verify token is still valid
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${savedToken}` }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(savedToken);
          } else {
            // Token is invalid, clear it
            Cookies.remove('authToken');
          }
        }
      } catch (error) {
        console.error('Session validation error:', error);
        Cookies.remove('authToken');
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();
  }, []);

  const loginWithPasscode = async (passcode: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Mã gán không đúng');
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    Cookies.set('authToken', data.token, { expires: 7 });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('authToken');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithPasscode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

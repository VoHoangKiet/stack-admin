import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import apiClient from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  isWorkspaceAdminOrOwner?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (credential: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient
        .get('/users/me')
        .then((res) => {
          const userData = res.data.data;
          if (userData.role !== 'ADMIN' && !userData.isWorkspaceAdminOrOwner) {
            localStorage.clear();
            window.location.href = '/login';
            return;
          }
          setUser(userData);
        })
        .catch(() => {
          localStorage.clear();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credential: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email: credential, password });
    const { accessToken, refreshToken } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    const profileRes = await apiClient.get('/users/me');
    const userData = profileRes.data.data;

    if (userData.role !== 'ADMIN' && !userData.isWorkspaceAdminOrOwner) {
      localStorage.clear();
      throw new Error('Tài khoản không có quyền truy cập admin');
    }

    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.get('/auth/logout');
    } catch {
      // ignore
    }
    localStorage.clear();
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import React from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../lib/auth';
import { AdminLayout } from './AdminLayout';

interface ProtectedLayoutProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const ProtectedLayout: React.FC<ProtectedLayoutProps> = ({ darkMode, setDarkMode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AdminLayout darkMode={darkMode} setDarkMode={setDarkMode} />;
};

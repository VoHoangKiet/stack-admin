import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './lib/auth';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Workspaces } from './pages/Workspaces';
import { AuditLogs } from './pages/AuditLogs';
import { TaskMonitor } from './pages/TaskMonitor';
import { Health } from './pages/Health';
import { Analytics } from './pages/Analytics';
import { Content } from './pages/Content';
import { Communications } from './pages/Communications';
import viVN from 'antd/locale/vi_VN';

const App: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync theme to document element and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#fa8c16',
          borderRadius: 8,
          fontFamily: "'Be Vietnam Pro', sans-serif",
          colorBgBase: darkMode ? '#151c2c' : '#ffffff',
          colorBgContainer: darkMode ? '#151c2c' : '#ffffff',
          colorBorder: darkMode ? '#1e293b' : '#e2e8f0',
        },
        components: {
          Layout: {
            bodyBg: darkMode ? '#0b0f19' : '#f8fafc',
            headerBg: darkMode ? 'rgba(21, 28, 44, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            siderBg: darkMode ? '#111827' : '#ffffff',
          },
          Card: {
            colorBgContainer: darkMode ? '#151c2c' : '#ffffff',
            boxShadow: 'var(--shadow-sm)',
          },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: darkMode ? 'rgba(250, 140, 22, 0.15)' : 'rgba(250, 140, 22, 0.08)',
            itemSelectedColor: '#fa8c16',
          },
        },
      }}
    >
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="task-monitor" element={<TaskMonitor />} />
              <Route path="health" element={<Health />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="content" element={<Content />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="communications" element={<Communications />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;

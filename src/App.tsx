import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { AuthProvider } from './lib/auth';
import { WorkspaceProvider } from './lib/workspace-context';
import { ProtectedLayout } from './components/ProtectedLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { TaskMonitor } from './pages/TaskMonitor';
import { Health } from './pages/Health';
import { Analytics } from './pages/Analytics';
import { Content } from './pages/Content';
import { Communications } from './pages/Communications';
import { WorkspaceListPage } from './pages/workspace/WorkspaceListPage';
import { MembersPage } from './pages/workspace/MembersPage';
import { RolesPage } from './pages/workspace/RolesPage';
import { TasksPage } from './pages/workspace/TasksPage';
import { MeetingsPage } from './pages/workspace/MeetingsPage';
import { WorkspaceSettingsPage } from './pages/workspace/WorkspaceSettingsPage';
import { WorkspaceLayout } from './components/WorkspaceLayout';
import enUS from 'antd/locale/en_US';

// Redirects to /workspaces/:id/members using absolute path to avoid relative-path loop
const WorkspaceRedirect: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/workspaces/${id}/members`} replace />;
};

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
      locale={enUS}
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
          <WorkspaceProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedLayout darkMode={darkMode} setDarkMode={setDarkMode} />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<Users />} />
                <Route path="workspaces" element={<WorkspaceListPage />} />
                <Route path="task-monitor" element={<TaskMonitor />} />
                <Route path="health" element={<Health />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="content" element={<Content />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="communications" element={<Communications />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>

              {/* Workspace context routes – use WorkspaceLayout */}
              <Route
                path="/workspaces/:id"
                element={<WorkspaceLayout darkMode={darkMode} setDarkMode={setDarkMode} />}
              >
                <Route index element={<WorkspaceRedirect />} />
                <Route path="members" element={<MembersPage />} />
                <Route path="roles" element={<RolesPage />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="meetings" element={<MeetingsPage />} />
                <Route path="settings" element={<WorkspaceSettingsPage />} />
                {/* Wildcard MUST use absolute path – relative 'members' causes infinite loop */}
                <Route path="*" element={<WorkspaceRedirect />} />
              </Route>
            </Routes>
          </WorkspaceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;

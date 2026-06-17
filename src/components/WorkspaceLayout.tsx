import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Breadcrumb, Spin } from 'antd';
import { Link, useLocation, Outlet, useNavigate, useParams, Navigate } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  CheckSquare,
  CalendarDays,
  Settings as SettingsIcon,
  ChevronLeft,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronDown,
  User,
  Menu as MenuIcon,
  LayoutDashboard,
  Search,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useWorkspace } from '../lib/workspace-context';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import apiClient from '../lib/api';

const { Header, Sider, Content } = Layout;

interface WorkspaceLayoutProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({ darkMode, setDarkMode }) => {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { activeWorkspace, setActiveWorkspace, workspaces } = useWorkspace();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { id: workspaceId } = useParams<{ id: string }>();

  // Sync activeWorkspace from URL param
  useEffect(() => {
    if (workspaceId && workspaces.length > 0) {
      const ws = workspaces.find((w) => w.id === workspaceId);
      if (ws && ws.id !== activeWorkspace?.id) {
        setActiveWorkspace(ws);
      }
    }
  }, [workspaceId, workspaces]);

  // Auto-collapse on mobile
  useEffect(() => {
    const handleResize = () => setCollapsed(window.innerWidth < 992);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [countRes, listRes] = await Promise.all([
          apiClient.get('/notifications/unread-count'),
          apiClient.get('/notifications', { params: { size: 5 } }),
        ]);
        setUnreadCount(countRes.data.data?.unreadCount || 0);
        setNotifItems(listRes.data.data?.items || listRes.data.data || []);
      } catch {
        // ignore
      }
    };
    fetchNotifications();
  }, []);

  if (authLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const wsId = workspaceId || activeWorkspace?.id;

  const sidebarMenuItems = [
    {
      key: `/workspaces/${wsId}/members`,
      icon: <Users size={18} />,
      label: <Link to={`/workspaces/${wsId}/members`}>Members</Link>,
    },
    {
      key: `/workspaces/${wsId}/roles`,
      icon: <ShieldCheck size={18} />,
      label: <Link to={`/workspaces/${wsId}/roles`}>Roles</Link>,
    },
    {
      key: `/workspaces/${wsId}/tasks`,
      icon: <CheckSquare size={18} />,
      label: <Link to={`/workspaces/${wsId}/tasks`}>Tasks</Link>,
    },
    {
      key: `/workspaces/${wsId}/meetings`,
      icon: <CalendarDays size={18} />,
      label: <Link to={`/workspaces/${wsId}/meetings`}>Meetings</Link>,
    },
    { type: 'divider' as const },
    {
      key: `/workspaces/${wsId}/settings`,
      icon: <SettingsIcon size={18} />,
      label: <Link to={`/workspaces/${wsId}/settings`}>Settings</Link>,
    },
  ];

  // Breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSection = pathParts[pathParts.length - 1];
  const sectionLabel: Record<string, string> = {
    members: 'Members',
    roles: 'Roles',
    tasks: 'Tasks',
    meetings: 'Meetings',
    settings: 'Settings',
  };

  const userMenuItems = [
    {
      key: 'dashboard',
      label: 'Back to Dashboard',
      icon: <LayoutDashboard size={14} />,
      onClick: () => navigate('/'),
    },
    {
      key: 'profile',
      label: 'Profile',
      icon: <User size={14} />,
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: 'Logout',
      danger: true,
      icon: <LogOut size={14} />,
      onClick: () => logout(),
    },
  ];

  const notificationMenu = {
    items:
      notifItems.length > 0
        ? notifItems.map((n: any, i: number) => ({
            key: n.id || String(i),
            label: (
              <div style={{ padding: '4px 8px', maxWidth: 250 }}>
                <p style={{ margin: 0, fontSize: '13px' }}>{n.title || n.body || 'New Notification'}</p>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {n.createdAt ? new Date(n.createdAt).toLocaleString('en-US') : ''}
                </p>
              </div>
            ),
          }))
        : [
            {
              key: 'empty',
              label: (
                <div style={{ padding: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
                  No notifications
                </div>
              ),
            },
          ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Workspace Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={240}
        collapsedWidth={72}
        theme={darkMode ? 'dark' : 'light'}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'all var(--transition-normal)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Workspace Switcher at top */}
        <WorkspaceSwitcher collapsed={collapsed} />

        {/* Nav menu */}
        <div style={{ flex: 1, overflow: 'hidden auto' }}>
          <Menu
            theme={darkMode ? 'dark' : 'light'}
            mode="inline"
            selectedKeys={[location.pathname]}
            items={sidebarMenuItems}
            style={{ marginTop: 4, border: 'none' }}
          />
        </div>


        {/* Back to admin */}
        <div
          style={{
            padding: collapsed ? '16px 0' : '12px 16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <Button
            type="text"
            icon={<ChevronLeft size={16} />}
            onClick={() => navigate('/workspaces')}
            style={{
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              height: 36,
              padding: collapsed ? '0 8px' : '0 12px',
            }}
          >
            {!collapsed && 'All Workspaces'}
          </Button>
        </div>
      </Sider>

      {/* Main wrapper */}
      <Layout
        style={{
          marginLeft: collapsed ? 72 : 240,
          transition: 'all var(--transition-normal)',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <Header
          className="glass-effect"
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            left: collapsed ? 72 : 240,
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all var(--transition-normal)',
            padding: '0 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<MenuIcon size={18} />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            <Breadcrumb>
              <Breadcrumb.Item>
                <Link to="/workspaces">Workspaces</Link>
              </Breadcrumb.Item>
              {activeWorkspace && (
                <Breadcrumb.Item>
                  <Link to={`/workspaces/${activeWorkspace.id}/members`}>{activeWorkspace.name}</Link>
                </Breadcrumb.Item>
              )}
              {sectionLabel[currentSection] && (
                <Breadcrumb.Item>{sectionLabel[currentSection]}</Breadcrumb.Item>
              )}
            </Breadcrumb>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Search */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }} className="hidden-mobile">
              <Search size={15} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search..."
                style={{
                  padding: '6px 12px 6px 30px',
                  borderRadius: 10,
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  width: 160,
                  fontSize: 13,
                  outline: 'none',
                  transition: 'all var(--transition-fast)',
                }}
                onFocus={(e) => {
                  e.target.style.width = '220px';
                  e.target.style.borderColor = 'var(--primary)';
                }}
                onBlur={(e) => {
                  e.target.style.width = '160px';
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>

            {/* Dark mode toggle */}
            <Button
              type="text"
              icon={darkMode ? <Sun size={18} style={{ color: '#eab308' }} /> : <Moon size={18} />}
              onClick={() => setDarkMode(!darkMode)}
              style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />

            {/* Notifications */}
            <Dropdown menu={notificationMenu} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" style={{ backgroundColor: 'var(--danger)' }}>
                <Button
                  type="text"
                  icon={<Bell size={18} />}
                  style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Badge>
            </Dropdown>

            {/* User */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  src={user?.avatar || undefined}
                  style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary)' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <span className="hidden-mobile" style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-main)' }}>
                  {user?.name || 'Admin'}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content style={{ marginTop: 64, padding: '24px', flexGrow: 1, overflowY: 'auto' }}>
          <Outlet />
        </Content>

        {/* Footer */}
        <footer
          style={{
            padding: '14px 24px',
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--text-muted)',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-card)',
          }}
        >
          Stack Admin &copy; {new Date().getFullYear()} – Workspace Management
        </footer>
      </Layout>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </Layout>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Badge, Breadcrumb } from 'antd';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  Bell,
  ChevronDown,
  Menu as MenuIcon,
  Search,
  User,
  ShieldCheck,
  Building2,
  History,
  CheckSquare,
  Activity,
  BarChart3,
  FileText,
  Phone,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import apiClient from '../lib/api';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifItems, setNotifItems] = useState<any[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch real notification count
  const fetchNotifications = useCallback(async () => {
    try {
      const [countRes, listRes] = await Promise.all([
        apiClient.get('/notifications/unread-count'),
        apiClient.get('/notifications', { params: { size: 5 } }),
      ]);
      setUnreadCount(countRes.data.data?.unreadCount || 0);
      const items = listRes.data.data?.items || listRes.data.data || [];
      setNotifItems(items);
    } catch {
      // Notifications API may not have data yet
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);



  // Handle auto-collapse on mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 992) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // check on mount
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return (
      <Breadcrumb style={{ margin: '0', display: 'flex', alignItems: 'center' }}>
        <Breadcrumb.Item>
          <Link to="/">Trang chủ</Link>
        </Breadcrumb.Item>
        {pathnames.map((name, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName =
            name === 'users' ? 'Quản lý người dùng' :
            name === 'settings' ? 'Cài đặt hệ thống' :
            name === 'workspaces' ? 'Quản lý Workspace' :
            name === 'task-monitor' ? 'Giám sát công việc' :
            name === 'health' ? 'Sức khỏe hệ thống' :
            name === 'analytics' ? 'Phân tích' :
            name === 'content' ? 'Quản lý nội dung' :
            name === 'audit-logs' ? 'Nhật ký hoạt động' :
            name === 'communications' ? 'Liên lạc' :
            name.charAt(0).toUpperCase() + name.slice(1);
          
          return isLast ? (
            <Breadcrumb.Item key={name}>{displayName}</Breadcrumb.Item>
          ) : (
            <Breadcrumb.Item key={name}>
              <Link to={routeTo}>{displayName}</Link>
            </Breadcrumb.Item>
          );
        })}
      </Breadcrumb>
    );
  };

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={18} />,
      label: <Link to="/">Tổng quan</Link>,
    },
    {
      key: '/users',
      icon: <Users size={18} />,
      label: <Link to="/users">Người dùng</Link>,
    },
    {
      key: '/workspaces',
      icon: <Building2 size={18} />,
      label: <Link to="/workspaces">Workspace</Link>,
    },
    {
      key: '/task-monitor',
      icon: <CheckSquare size={18} />,
      label: <Link to="/task-monitor">Công việc</Link>,
    },
    {
      key: '/health',
      icon: <Activity size={18} />,
      label: <Link to="/health">Hệ thống</Link>,
    },
    {
      key: '/analytics',
      icon: <BarChart3 size={18} />,
      label: <Link to="/analytics">Phân tích</Link>,
    },
    {
      key: '/content',
      icon: <FileText size={18} />,
      label: <Link to="/content">Nội dung</Link>,
    },
    {
      key: '/audit-logs',
      icon: <History size={18} />,
      label: <Link to="/audit-logs">Nhật ký</Link>,
    },
    {
      key: '/communications',
      icon: <Phone size={18} />,
      label: <Link to="/communications">Liên lạc</Link>,
    },
    {
      key: '/settings',
      icon: <SettingsIcon size={18} />,
      label: <Link to="/settings">Cài đặt</Link>,
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ cá nhân',
      icon: <User size={14} />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      danger: true,
      icon: <LogOut size={14} />,
      onClick: () => logout(),
    },
  ];

  const notificationMenu = {
    items: notifItems.length > 0
      ? notifItems.map((n: any, i: number) => ({
          key: n.id || String(i),
          label: (
            <div style={{ padding: '4px 8px', maxWidth: 250 }}>
              <p style={{ margin: 0, fontSize: '13px' }}>{n.title || n.body || 'Thông báo mới'}</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                {n.createdAt ? new Date(n.createdAt).toLocaleString('vi-VN') : ''}
              </p>
            </div>
          ),
        }))
      : [{ key: 'empty', label: <div style={{ padding: '8px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Không có thông báo</div> }],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sider (Sidebar menu) */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={260}
        collapsedWidth={80}
        theme={darkMode ? 'dark' : 'light'}
        style={{
          position: 'fixed',
          height: '100vh',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          transition: 'all var(--transition-normal)',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: '0 24px',
          borderBottom: `1px solid var(--border-color)`,
          gap: 12
        }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            flexShrink: 0
          }} className="gradient-primary">
            <ShieldCheck size={20} />
          </div>
          {!collapsed && (
            <span style={{ 
              fontWeight: 700, 
              fontSize: '18px', 
              letterSpacing: '-0.5px',
              color: 'var(--text-main)',
              whiteSpace: 'nowrap'
            }}>
              Stack Admin
            </span>
          )}
        </div>

        <Menu
          theme={darkMode ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ marginTop: 16 }}
        />
      </Sider>

      {/* Main Layout wrapper */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 260, 
        transition: 'all var(--transition-normal)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <Header className="glass-effect" style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 80 : 260,
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all var(--transition-normal)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Button
              type="text"
              icon={<MenuIcon size={18} />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />
            <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center' }}>
              {getBreadcrumbs()}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Search Bar - Aesthetic dummy */}
            <div style={{ 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center',
              marginRight: 8
            }} className="hidden-mobile">
              <Search size={16} style={{ position: 'absolute', left: 10, color: 'var(--text-light)' }} />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                style={{
                  padding: '6px 12px 6px 32px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  width: 180,
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'all var(--transition-fast)'
                }}
                onFocus={(e) => {
                  e.target.style.width = '240px';
                  e.target.style.borderColor = 'var(--primary)';
                }}
                onBlur={(e) => {
                  e.target.style.width = '180px';
                  e.target.style.borderColor = 'var(--border-color)';
                }}
              />
            </div>

            {/* Dark/Light mode toggle */}
            <Button
              type="text"
              icon={darkMode ? <Sun size={18} style={{ color: '#eab308' }} /> : <Moon size={18} />}
              onClick={() => setDarkMode(!darkMode)}
              style={{
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            {/* Notifications */}
            <Dropdown menu={notificationMenu} placement="bottomRight" trigger={['click']}>
              <Badge count={unreadCount} size="small" style={{ backgroundColor: 'var(--danger)' }}>
                <Button
                  type="text"
                  icon={<Bell size={18} />}
                  style={{
                    width: 40,
                    height: 40,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />
              </Badge>
            </Dropdown>

            {/* User Profile Dropdown */}
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar
                  size="small"
                  src={user?.avatar || undefined}
                  style={{ border: '2px solid var(--primary)', backgroundColor: 'var(--primary)', verticalAlign: 'middle' }}
                >
                  {user?.name?.charAt(0)?.toUpperCase()}
                </Avatar>
                <span className="hidden-mobile" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-main)' }}>
                  {user?.name || 'Admin'}
                </span>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Content Area */}
        <Content style={{ 
          marginTop: 64, // Header height
          padding: '24px',
          flexGrow: 1,
          overflowY: 'auto'
        }}>
          <Outlet />
        </Content>

        {/* Footer */}
        <footer style={{ 
          padding: '16px 24px', 
          textAlign: 'center', 
          fontSize: '13px', 
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-card)'
        }}>
          Stack Admin &copy; {new Date().getFullYear()} - Thiết kế với ❤️ và Ant Design
        </footer>
      </Layout>

      {/* Basic Mobile Responsive Help Styles */}
      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile {
            display: none !important;
          }
        }
      `}</style>
    </Layout>
  );
};

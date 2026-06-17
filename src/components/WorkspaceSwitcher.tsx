import React, { useState } from 'react';
import { Avatar, Dropdown, Input, Tag, Spin, Badge } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Building2, ChevronDown, Check, Search, Plus } from 'lucide-react';
import { useWorkspace } from '../lib/workspace-context';
import type { WorkspaceItem } from '../lib/workspace-context';

const planColor: Record<string, string> = {
  free: '#64748b',
  pro: '#3b82f6',
  enterprise: '#8b5cf6',
};

const planBg: Record<string, string> = {
  free: 'rgba(100,116,139,0.12)',
  pro: 'rgba(59,130,246,0.12)',
  enterprise: 'rgba(139,92,246,0.12)',
};

interface WorkspaceSwitcherProps {
  collapsed?: boolean;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ collapsed = false }) => {
  const { workspaces, activeWorkspace, setActiveWorkspace, loading } = useWorkspace();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = workspaces.filter(
    (ws) =>
      ws.name.toLowerCase().includes(search.toLowerCase()) ||
      ws.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (ws: WorkspaceItem) => {
    setActiveWorkspace(ws);
    navigate(`/workspaces/${ws.id}/members`);
  };

  // Simple letter avatar with flat background
  const WorkspaceAvatar = ({ ws, size = 32 }: { ws: WorkspaceItem; size?: number }) => (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 7,
        background: 'var(--primary-light)',
        border: '1px solid rgba(250,140,22,0.18)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--primary)',
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {ws.name.charAt(0).toUpperCase()}
    </div>
  );

  const dropdownContent = (
    <div
      style={{
        width: 280,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        overflow: 'hidden',
      }}
    >
      {/* Search */}
      {workspaces.length > 4 && (
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-color)' }}>
          <Input
            prefix={<Search size={14} style={{ color: 'var(--text-muted)' }} />}
            placeholder="Search workspaces..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            variant="borderless"
            style={{ background: 'var(--bg-app)', borderRadius: 8, padding: '4px 8px' }}
          />
        </div>
      )}

      {/* List */}
      <div style={{ maxHeight: 280, overflowY: 'auto', padding: '6px 0' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 16 }}>
            <Spin size="small" />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
            No workspaces found
          </div>
        ) : (
          filtered.map((ws) => {
            const isActive = activeWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => handleSelect(ws)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 12px 7px 10px',
                  cursor: 'pointer',
                  borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  background: isActive ? 'var(--bg-app)' : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg-app)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = isActive ? 'var(--bg-app)' : 'transparent';
                }}
              >
                <WorkspaceAvatar ws={ws} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 13,
                      color: isActive ? 'var(--primary)' : 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ws.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>/{ws.slug}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isActive && (
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {ws.plan}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '8px 12px',
        }}
      >
        <div
          onClick={() => navigate('/workspaces')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 8px',
            cursor: 'pointer',
            borderRadius: 8,
            color: 'var(--text-muted)',
            fontSize: 13,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'var(--bg-app)';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-main)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
          }}
        >
          <Building2 size={14} />
          View all workspaces
        </div>
      </div>
    </div>
  );

  if (!activeWorkspace && !loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 16px' : '0 20px',
          height: 64,
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Building2 size={18} style={{ color: 'var(--text-muted)' }} />
        </div>
        {!collapsed && (
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No workspace</span>
        )}
      </div>
    );
  }

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      placement="bottomLeft"
      overlayStyle={{ zIndex: 1050 }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: collapsed ? '0 16px' : '0 16px',
          height: 64,
          borderBottom: '1px solid var(--border-color)',
          cursor: 'pointer',
          transition: 'background 0.15s',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'var(--bg-app)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {loading ? (
          <Spin size="small" />
        ) : activeWorkspace ? (
          <>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'var(--primary-light)',
                border: '1px solid rgba(250,140,22,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
                fontWeight: 700,
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {activeWorkspace.name.charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {activeWorkspace.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {activeWorkspace.currentUserRole || 'member'}
                  </div>
                </div>
                <ChevronDown size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </>
            )}
          </>
        ) : null}
      </div>
    </Dropdown>
  );
};

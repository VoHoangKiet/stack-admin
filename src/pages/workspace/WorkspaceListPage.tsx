import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Spin, Empty } from 'antd';
import {
  Building2,
  Crown,
  ArrowRight,
  RefreshCw,
  Calendar,
  Shield,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useWorkspace } from '../../lib/workspace-context';
import type { WorkspaceItem } from '../../lib/workspace-context';

const planStyle: Record<string, { color: string; label: string }> = {
  free:       { color: '#8c8c8c', label: 'Free' },
  pro:        { color: '#2563eb', label: 'Pro' },
  enterprise: { color: '#7c3aed', label: 'Enterprise' },
};

const roleStyle: Record<string, { color: string; label: string }> = {
  owner:  { color: '#d46b08', label: 'Owner' },
  admin:  { color: '#1d4ed8', label: 'Admin' },
  member: { color: '#4b5563', label: 'Member' },
};

export const WorkspaceListPage: React.FC = () => {
  const { workspaces, loading, refreshWorkspaces, setActiveWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const handleEnter = (ws: WorkspaceItem) => {
    setActiveWorkspace(ws);
    navigate(`/workspaces/${ws.id}/members`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 960, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Administration
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: 'var(--text-main)', letterSpacing: '-0.3px' }}>
            My Workspaces
          </h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: 14, fontWeight: 400 }}>
            {workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''} you manage
          </p>
        </div>
        <Button
          icon={<RefreshCw size={14} />}
          onClick={refreshWorkspaces}
          style={{
            height: 36,
            borderRadius: 8,
            fontSize: 13,
            color: 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Refresh
        </Button>
      </div>

      {/* Empty state */}
      {workspaces.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '64px 20px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
        }}>
          <Empty
            image={<Building2 size={40} style={{ color: 'var(--border-color)' }} />}
            imageStyle={{ height: 56, display: 'flex', justifyContent: 'center' }}
            description={
              <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                You don't manage any workspaces yet
              </span>
            }
          />
        </div>
      )}

      {/* Workspace list — clean rows, not cards */}
      {workspaces.length > 0 && (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          {workspaces.map((ws, index) => {
            const plan = planStyle[ws.plan] || planStyle.free;
            const role = roleStyle[ws.currentUserRole?.toLowerCase() || 'member'] || roleStyle.member;
            const isLast = index === workspaces.length - 1;

            return (
              <div
                key={ws.id}
                onClick={() => handleEnter(ws)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '18px 24px',
                  borderBottom: isLast ? 'none' : '1px solid var(--border-color)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'var(--bg-app)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {/* Avatar initials */}
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'var(--primary-light)',
                  border: '1px solid rgba(250,140,22,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 17,
                  flexShrink: 0,
                  letterSpacing: '-0.5px',
                }}>
                  {ws.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + slug */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'var(--text-main)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginBottom: 3,
                  }}>
                    {ws.name}
                  </div>
                  <div style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'monospace',
                    letterSpacing: '-0.2px',
                  }}>
                    /{ws.slug}
                  </div>
                </div>

                {/* Meta pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} className="hidden-mobile">
                  {/* Role */}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: role.color,
                    background: `${role.color}12`,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${role.color}28`,
                  }}>
                    {role.label}
                  </span>

                  {/* Plan */}
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: plan.color,
                    background: `${plan.color}10`,
                    padding: '3px 10px',
                    borderRadius: 6,
                    border: `1px solid ${plan.color}25`,
                  }}>
                    {plan.label}
                  </span>

                  {/* Owner */}
                  {ws.ownerName && (
                    <span style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Crown size={11} />
                      {ws.ownerName}
                    </span>
                  )}

                  {/* Date */}
                  <span style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Calendar size={11} />
                    {new Date(ws.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Quick action area */}
      {workspaces.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
          Click a workspace to manage members, roles, tasks and meetings
        </p>
      )}
    </div>
  );
};

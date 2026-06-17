import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import apiClient from './api';
import { useAuth } from './auth';

export interface WorkspaceCapabilities {
  canInviteMembers?: boolean;
  canUpdateMemberRole?: boolean;
  canRemoveMembers?: boolean;
  canCreateChannel?: boolean;
  canManageWorkspaceRoles?: boolean;
  canUpdateWorkspaceSettings?: boolean;
}

export interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  plan: string;
  createdAt: string;
  currentUserRole?: string;
  permissions?: WorkspaceCapabilities;
  memberCount?: number;
}

interface WorkspaceContextType {
  workspaces: WorkspaceItem[];
  activeWorkspace: WorkspaceItem | null;
  setActiveWorkspace: (ws: WorkspaceItem) => void;
  capabilities: WorkspaceCapabilities;
  loading: boolean;
  refreshWorkspaces: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const getCapabilities = (ws: WorkspaceItem | null, isSystemAdmin: boolean): WorkspaceCapabilities => {
  if (!ws) return {};
  if (isSystemAdmin || ws.currentUserRole === 'owner') {
    return {
      canInviteMembers: true,
      canUpdateMemberRole: true,
      canRemoveMembers: true,
      canCreateChannel: true,
      canManageWorkspaceRoles: true,
      canUpdateWorkspaceSettings: true,
    };
  }
  return ws.permissions || {};
};

export const WorkspaceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeWorkspace, setActiveWorkspaceState] = useState<WorkspaceItem | null>(null);
  const [loading, setLoading] = useState(true);

  const isSystemAdmin = user?.role === 'ADMIN';

  const refreshWorkspaces = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiClient.get('/workspaces/me');
      const data: WorkspaceItem[] = res.data.data || [];

      const managed = isSystemAdmin
        ? data
        : data.filter(
            (ws) =>
              ws.ownerId === user.id ||
              ws.currentUserRole === 'owner' ||
              ws.currentUserRole === 'admin' ||
              ws.permissions?.canManageWorkspaceRoles ||
              ws.permissions?.canUpdateMemberRole ||
              ws.permissions?.canInviteMembers
          );

      setWorkspaces(managed);

      // Restore previously active workspace
      const savedId = localStorage.getItem('activeWorkspaceId');
      const found = managed.find((w) => w.id === savedId);
      if (found) {
        setActiveWorkspaceState(found);
      } else if (managed.length > 0) {
        setActiveWorkspaceState(managed[0]);
        localStorage.setItem('activeWorkspaceId', managed[0].id);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user, isSystemAdmin]);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const setActiveWorkspace = (ws: WorkspaceItem) => {
    setActiveWorkspaceState(ws);
    localStorage.setItem('activeWorkspaceId', ws.id);
  };

  const capabilities = getCapabilities(activeWorkspace, isSystemAdmin);

  return (
    <WorkspaceContext.Provider
      value={{ workspaces, activeWorkspace, setActiveWorkspace, capabilities, loading, refreshWorkspaces }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
};

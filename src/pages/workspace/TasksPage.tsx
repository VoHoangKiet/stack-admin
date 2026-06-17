import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Select,
  Button,
  Input,
  Card,
  Avatar,
  Segmented,
  Empty,
  Tooltip,
} from 'antd';
import {
  CheckSquare,
  RefreshCw,
  LayoutList,
  Kanban,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  User,
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { useWorkspace } from '../../lib/workspace-context';

interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  dueDate?: string;
  createdAt: string;
  workspaceId?: string;
}

interface Member {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
}

const statusMeta: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  todo: { label: 'To Do', color: '#64748b', icon: <Circle size={13} /> },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: <Clock size={13} /> },
  done: { label: 'Done', color: '#22c55e', icon: <CheckCircle2 size={13} /> },
  blocked: { label: 'Blocked', color: '#ef4444', icon: <AlertCircle size={13} /> },
};

const priorityMeta: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: '#64748b' },
  medium: { label: 'Medium', color: '#f59e0b' },
  high: { label: 'High', color: '#ef4444' },
  urgent: { label: 'Urgent', color: '#8b5cf6' },
};

export const TasksPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { activeWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();
  const defaultAssigneeId = searchParams.get('assigneeId');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(defaultAssigneeId || undefined);
  const [search, setSearch] = useState('');

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/members`, { params: { take: 100 } });
      setMembers(res.data.data || []);
    } catch {
      setMembers([]);
    }
  }, [workspaceId]);

  const fetchTasks = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (assigneeFilter) params.assigneeId = assigneeFilter;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (search) params.search = search;

      const res = await apiClient.get(`/admin/workspaces/${workspaceId}/tasks`, { params });
      setTasks(res.data.data?.items || res.data.data || []);
    } catch {
      // API might not support all filters – graceful fallback
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, assigneeFilter, statusFilter, priorityFilter, search]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Update assignee filter when URL param changes
  useEffect(() => {
    if (defaultAssigneeId) setAssigneeFilter(defaultAssigneeId);
  }, [defaultAssigneeId]);

  const columns = [
    {
      title: 'Task',
      dataIndex: 'title',
      render: (title: string) => (
        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{title}</span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 140,
      render: (status: string) => {
        const meta = statusMeta[status] || { label: status, color: '#64748b', icon: <Circle size={13} /> };
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: meta.color,
              background: `${meta.color}18`,
              padding: '3px 10px',
              borderRadius: 20,
            }}
          >
            {meta.icon}
            {meta.label}
          </span>
        );
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      width: 110,
      render: (priority: string) => {
        if (!priority) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const meta = priorityMeta[priority] || { label: priority, color: '#64748b' };
        return (
          <Tag
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: meta.color,
              background: `${meta.color}18`,
              border: 'none',
              borderRadius: 20,
              margin: 0,
            }}
          >
            {meta.label}
          </Tag>
        );
      },
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      width: 160,
      render: (assignee: Task['assignee']) => {
        if (!assignee) return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unassigned</span>;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Avatar size={26} src={assignee.avatar || undefined} style={{ background: 'var(--primary)', fontSize: 12 }}>
              {assignee.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{assignee.name}</span>
          </div>
        );
      },
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      width: 120,
      render: (date: string) => {
        if (!date) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
        const isOverdue = new Date(date) < new Date();
        return (
          <span
            style={{
              fontSize: 12,
              color: isOverdue ? '#ef4444' : 'var(--text-muted)',
              fontWeight: isOverdue ? 600 : 400,
            }}
          >
            {new Date(date).toLocaleDateString('vi-VN')}
          </span>
        );
      },
    },
  ];

  // Board view grouped by status
  const BoardView = () => {
    const statuses = ['todo', 'in_progress', 'done', 'blocked'];
    return (
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        {statuses.map((status) => {
          const meta = statusMeta[status];
          const statusTasks = tasks.filter((t) => t.status === status);
          return (
            <div
              key={status}
              style={{
                minWidth: 240,
                flex: '0 0 240px',
                background: 'var(--bg-app)',
                borderRadius: 14,
                border: '1px solid var(--border-color)',
                overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: `${meta.color}10`,
                }}
              >
                <span style={{ color: meta.color }}>{meta.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-main)' }}>{meta.label}</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: 11,
                    fontWeight: 700,
                    color: meta.color,
                    background: `${meta.color}20`,
                    padding: '1px 7px',
                    borderRadius: 20,
                  }}
                >
                  {statusTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 100 }}>
                {statusTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, padding: '12px 0' }}>
                    No tasks
                  </div>
                ) : (
                  statusTasks.map((task) => {
                    const pri = priorityMeta[task.priority || ''];
                    return (
                      <div
                        key={task.id}
                        style={{
                          background: 'var(--bg-card)',
                          borderRadius: 10,
                          padding: '10px 12px',
                          border: '1px solid var(--border-color)',
                          cursor: 'pointer',
                          transition: 'box-shadow 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', marginBottom: 6 }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {pri ? (
                            <Tag
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                color: pri.color,
                                background: `${pri.color}18`,
                                border: 'none',
                                borderRadius: 20,
                                margin: 0,
                              }}
                            >
                              {pri.label}
                            </Tag>
                          ) : (
                            <span />
                          )}
                          {task.assignee && (
                            <Tooltip title={task.assignee.name}>
                              <Avatar
                                size={22}
                                src={task.assignee.avatar}
                                style={{ fontSize: 10, background: 'var(--primary)' }}
                              >
                                {task.assignee.name?.charAt(0)?.toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Tasks</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {activeWorkspace?.name} · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Segmented
            value={viewMode}
            onChange={(v) => setViewMode(v as 'list' | 'board')}
            options={[
              { value: 'list', icon: <LayoutList size={15} />, label: 'List' },
              { value: 'board', icon: <Kanban size={15} />, label: 'Board' },
            ]}
          />
          <Button icon={<RefreshCw size={15} />} onClick={fetchTasks} style={{ height: 38, borderRadius: 9 }} />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input.Search
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onSearch={fetchTasks}
          style={{ maxWidth: 240 }}
          allowClear
        />
        <Select
          placeholder="Filter by assignee"
          value={assigneeFilter}
          onChange={setAssigneeFilter}
          allowClear
          style={{ width: 200 }}
          options={members.map((m) => ({ label: m.name, value: m.userId }))}
          suffixIcon={<User size={13} />}
        />
        <Select
          placeholder="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 140 }}
          options={Object.entries(statusMeta).map(([k, v]) => ({ label: v.label, value: k }))}
        />
        <Select
          placeholder="Priority"
          value={priorityFilter}
          onChange={setPriorityFilter}
          allowClear
          style={{ width: 130 }}
          options={Object.entries(priorityMeta).map(([k, v]) => ({ label: v.label, value: k }))}
        />
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <Card
          bordered={false}
          style={{ borderRadius: 16, border: '1px solid var(--border-color)' }}
          styles={{ body: { padding: 0 } }}
        >
          {tasks.length === 0 && !loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Empty
                image={<CheckSquare size={40} style={{ color: 'var(--text-muted)' }} />}
                imageStyle={{ height: 50, display: 'flex', justifyContent: 'center' }}
                description={<span style={{ color: 'var(--text-muted)' }}>No tasks found</span>}
              />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={tasks}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 15 }}
              style={{ padding: '0 4px' }}
            />
          )}
        </Card>
      ) : (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading tasks...</div>
          ) : (
            <BoardView />
          )}
        </div>
      )}
    </div>
  );
};

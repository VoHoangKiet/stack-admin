import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Spin } from 'antd';
import { CheckSquare, RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import apiClient from '../lib/api';

export const TaskMonitor: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [timelineTotal, setTimelineTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, trendsRes, tlRes] = await Promise.all([
        apiClient.get('/admin/tasks/stats'),
        apiClient.get('/admin/tasks/trends', { params: { period: 'week' } }),
        apiClient.get('/admin/tasks/timeline', { params: { page, size: 15 } }),
      ]);
      setStats(statsRes.data.data);
      setTrends(trendsRes.data.data?.labels?.map((l: string, i: number) => ({
        label: l, value: trendsRes.data.data.values[i],
      })) || []);
      setTimeline(tlRes.data.data || []);
      setTimelineTotal(tlRes.data.meta?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statCards = stats ? [
    { title: 'Total Tasks', value: stats.total, color: '#fa8c16' },
    { title: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
    { title: 'Completed', value: stats.completed, color: '#10b981' },
    { title: 'To Do', value: stats.todo, color: '#8b5cf6' },
    { title: 'Overdue', value: stats.overdue, color: '#ef4444' },
  ] : [];

  const statusLabels: Record<string, string> = {
    todo: 'To Do', in_progress: 'In Progress', done: 'Completed',
  };
  const statusColors: Record<string, string> = {
    todo: 'default', in_progress: 'blue', done: 'success',
  };

  const timelineColumns = [
    { title: 'No.', key: 'index', width: 60, render: (_: any, __: any, i: number) => (page - 1) * 15 + i + 1 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130,
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s] || s}</Tag>,
    },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100,
      render: (p: string) => {
        const colors: Record<string, string> = { high: 'red', medium: 'orange', low: 'default' };
        return <Tag color={colors[p]}>{p || '—'}</Tag>;
      },
    },
    { title: 'Created Date', dataIndex: 'createdAt', key: 'createdAt', width: 130,
      render: (d: string) => new Date(d).toLocaleString('en-US'),
    },
    { title: 'Updated Date', dataIndex: 'updatedAt', key: 'updatedAt', width: 130,
      render: (d: string) => new Date(d).toLocaleString('en-US'),
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 130,
      render: (d: string) => d ? new Date(d).toLocaleDateString('en-US') : '—',
    },
    { title: 'Task List', key: 'taskList', width: 150,
      render: (_: any, r: any) => r.taskList?.name || '—',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Task Monitor</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Monitor task metrics across all workspaces.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>Refresh</Button>
      </div>

      {/* Stats cards */}
      <Row gutter={[16, 16]}>
        {statCards.map((s, i) => (
          <Col xs={12} sm={8} lg={4} key={i}>
            <Card bordered={false} styles={{ body: { padding: '16px 20px' } }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{s.title}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* By workspace */}
      {stats?.byWorkspace && stats.byWorkspace.length > 0 && (
        <Card title="Distribution by Workspace" bordered={false}>
          <Row gutter={[16, 16]}>
            {stats.byWorkspace.map((ws: any, i: number) => (
              <Col key={i}>
                <Tag color="orange">{ws.workspaceId?.substring(0, 8)}: {ws.count} tasks</Tag>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Trends chart */}
      {trends.length > 0 && (
        <Card title="New Tasks Created (7 Days)" bordered={false}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#fa8c16" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Timeline - metadata only */}
      <Card title="Timeline" bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          columns={timelineColumns}
          dataSource={timeline}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page, total: timelineTotal, pageSize: 15,
            onChange: p => setPage(p), showSizeChanger: false,
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    </div>
  );
};

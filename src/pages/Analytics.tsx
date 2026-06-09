import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Button, Modal, Descriptions, Input, Spin, Tag } from 'antd';
import { BarChart3, RefreshCw, Search, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import apiClient from '../lib/api';

export const Analytics: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<any[]>([]);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, wsRes] = await Promise.all([
        apiClient.get('/admin/analytics/users', { params: { days: 30 } }),
        apiClient.get('/admin/analytics/workspaces'),
      ]);
      setActiveUsers(usersRes.data.data?.labels?.map((l: string, i: number) => ({
        label: l, users: usersRes.data.data.values[i],
      })) || []);
      setWorkspaces(wsRes.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchUser = async () => {
    if (!searchId) return;
    try {
      const res = await apiClient.get(`/admin/analytics/users/${searchId}/activity`);
      setUserDetail(res.data.data);
      setDetailOpen(true);
    } catch {
      setUserDetail(null);
      setDetailOpen(true);
    }
  };

  const wsColumns = [
    { title: 'Workspace', dataIndex: 'name', key: 'name' },
    { title: 'Chủ sở hữu', dataIndex: 'ownerName', key: 'ownerName' },
    { title: 'Thành viên', dataIndex: 'memberCount', key: 'memberCount' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Phân tích</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>User activity và workspace analytics.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>Làm mới</Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12}><Card bordered={false}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fa8c16' }}>{workspaces.length}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Workspace</div>
        </Card></Col>
        <Col xs={12}><Card bordered={false}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
            {activeUsers.reduce((s, r) => s + r.users, 0)}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Lượt active (30 ngày)</div>
        </Card></Col>
      </Row>

      {activeUsers.length > 0 && (
        <Card title="User Active (30 ngày)" bordered={false}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activeUsers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card title="Workspace Ranking" bordered={false} styles={{ body: { padding: 0 } }}>
        <Table dataSource={workspaces} columns={wsColumns} rowKey="id" pagination={false} loading={loading} />
      </Card>

      <Card title="Tra cứu người dùng" bordered={false}>
        <div style={{ display: 'flex', gap: 12 }}>
          <Input.Search
            placeholder="Nhập User ID..."
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onSearch={searchUser}
            style={{ maxWidth: 400 }}
            enterButton="Tra cứu"
          />
        </div>
      </Card>

      <Modal title="User Detail" open={detailOpen} onCancel={() => setDetailOpen(false)} footer={null}>
        {userDetail ? (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{userDetail.user?.id}</Descriptions.Item>
            <Descriptions.Item label="Email">{userDetail.user?.email}</Descriptions.Item>
            <Descriptions.Item label="Name">{userDetail.user?.name}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag>{userDetail.user?.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Workspace count">{userDetail.workspaceCount}</Descriptions.Item>
          </Descriptions>
        ) : (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>Không tìm thấy user</div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Modal, Descriptions, Badge, Avatar } from 'antd';
import { Building2, Eye, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';

// Type for workspace member (from /workspaces/:id/members)
interface WorkspaceMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  status: string;
  joinedAt: string;
}

// Type for workspace list item (from /workspaces/me or admin all workspaces)
interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  plan: string;
  createdAt: string;
}

export const Workspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/workspaces/me');
      setWorkspaces(res.data.data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const openDetail = async (ws: WorkspaceItem) => {
    setSelectedWs(ws);
    setDetailOpen(true);
    setMembersLoading(true);
    try {
      const res = await apiClient.get(`/workspaces/${ws.id}/members`);
      setMembers(res.data.data);
    } catch {
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const planColors: Record<string, string> = {
    free: 'default',
    pro: 'blue',
    enterprise: 'purple',
  };

  const columns = [
    {
      title: 'Workspace',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: WorkspaceItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}
          >
            <Building2 size={18} />
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Chủ sở hữu',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (name: string, record: WorkspaceItem) => (
        <span style={{ color: 'var(--text-main)' }}>{name || record.ownerEmail || '—'}</span>
      ),
    },
    {
      title: 'Gói',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color={planColors[plan] || 'default'}>{plan.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(date).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: WorkspaceItem) => (
        <Button
          type="link"
          icon={<Eye size={15} />}
          onClick={() => openDetail(record)}
        >
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Quản lý Workspace
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Xem danh sách và thông tin chi tiết các workspace trên hệ thống.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={fetchWorkspaces}
          style={{ height: '40px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      {/* Summary cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Building2 size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{workspaces.length}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tổng workspace</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Workspace table */}
      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={workspaces}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={selectedWs?.name || 'Workspace Detail'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={640}
      >
        {selectedWs && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Tên">{selectedWs.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">/{selectedWs.slug}</Descriptions.Item>
              <Descriptions.Item label="Chủ sở hữu">{selectedWs.ownerName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Gói">
                <Tag color={planColors[selectedWs.plan]}>{selectedWs.plan.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(selectedWs.createdAt).toLocaleDateString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Thành viên ({members.length})</h4>
            <Table
              dataSource={members}
              rowKey="id"
              loading={membersLoading}
              pagination={false}
              size="small"
              columns={[
                {
                  title: 'Thành viên',
                  dataIndex: 'name',
                  render: (name: string, record: WorkspaceMember) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar size="small" src={record.avatar || undefined} style={{ verticalAlign: 'middle' }}>
                        {name?.charAt(0)?.toUpperCase()}
                      </Avatar>
                      <div>
                        <span style={{ fontWeight: 500 }}>{name}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 8 }}>{record.email}</span>
                      </div>
                    </div>
                  ),
                },
                {
                  title: 'Vai trò',
                  dataIndex: 'roleName',
                  width: 120,
                  render: (role: string) => (
                    <Tag color={role === 'owner' ? 'orange' : role === 'admin' ? 'purple' : 'blue'}>
                      {role}
                    </Tag>
                  ),
                },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  width: 120,
                  render: (status: string) => (
                    <Badge status={status === 'active' ? 'success' : 'default'} text={status} />
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>
    </div>
  );
};

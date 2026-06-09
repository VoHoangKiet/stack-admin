import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Select, Input, Space, message } from 'antd';
import { RefreshCw, Search, History } from 'lucide-react';
import apiClient from '../lib/api';

interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, any>;
  status: string;
  ipAddress: string;
  createdAt: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [actionFilter, setActionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, size: pageSize, sortBy: 'createdAt', sortOrder: 'DESC' };
      if (actionFilter) params.action = actionFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchText) params.search = searchText;

      const res = await apiClient.get('/admin/audit-logs', { params });
      setLogs(res.data.data);
      setTotal(res.data.meta?.total || 0);
    } catch {
      message.error('Không thể tải audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, statusFilter, searchText]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionLabels: Record<string, string> = {
    'user.create': 'Tạo người dùng',
    'user.update': 'Cập nhật người dùng',
    'user.delete': 'Xoá người dùng',
    'settings.update': 'Cập nhật cấu hình',
    'workspace.view': 'Xem workspace',
  };

  const resourceLabels: Record<string, string> = {
    user: 'Người dùng',
    workspace: 'Workspace',
    setting: 'Cấu hình',
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {new Date(date).toLocaleString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Người thực hiện',
      dataIndex: 'userName',
      key: 'userName',
      width: 200,
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name || '—'}</span>
      ),
    },
    {
      title: 'Hành động',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (action: string) => (
        <Tag color={action.includes('delete') ? 'red' : action.includes('create') ? 'green' : 'blue'}>
          {actionLabels[action] || action}
        </Tag>
      ),
    },
    {
      title: 'Đối tượng',
      dataIndex: 'resourceType',
      key: 'resourceType',
      width: 120,
      render: (type: string) => (
        <span style={{ color: 'var(--text-muted)' }}>{resourceLabels[type] || type}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'success' ? 'success' : 'error'}>
          {status === 'success' ? 'Thành công' : 'Thất bại'}
        </Tag>
      ),
    },
    {
      title: 'IP',
      dataIndex: 'ipAddress',
      key: 'ipAddress',
      width: 140,
      render: (ip: string) => (
        <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
          {ip || '—'}
        </span>
      ),
    },
    {
      title: 'Chi tiết',
      key: 'metadata',
      render: (_: any, record: AuditLogItem) => (
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {record.metadata?.method} {record.metadata?.path?.split('?')[0]}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Nhật ký hoạt động
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Theo dõi tất cả hoạt động quản trị trên hệ thống.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={fetchLogs}
          style={{ height: '40px', borderRadius: 'var(--radius-md)' }}
        >
          Làm mới
        </Button>
      </div>

      {/* Filters */}
      <Card bordered={false}>
        <Space wrap size="middle">
          <Input
            placeholder="Tìm kiếm..."
            prefix={<Search size={16} style={{ color: 'var(--text-light)' }} />}
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
            style={{ width: 240, height: 40 }}
            allowClear
          />
          <Select
            placeholder="Hành động"
            style={{ width: 180 }}
            allowClear
            onChange={(val) => { setActionFilter(val || null); setPage(1); }}
            options={[
              { value: 'user.create', label: 'Tạo người dùng' },
              { value: 'user.update', label: 'Cập nhật người dùng' },
              { value: 'user.delete', label: 'Xoá người dùng' },
              { value: 'settings.update', label: 'Cập nhật cấu hình' },
            ]}
          />
          <Select
            placeholder="Trạng thái"
            style={{ width: 150 }}
            allowClear
            onChange={(val) => { setStatusFilter(val || null); setPage(1); }}
            options={[
              { value: 'success', label: 'Thành công' },
              { value: 'failure', label: 'Thất bại' },
            ]}
          />
          {(actionFilter || statusFilter || searchText) && (
            <Button
              type="text"
              onClick={() => {
                setActionFilter(null);
                setStatusFilter(null);
                setSearchText('');
                setPage(1);
              }}
              style={{ fontWeight: 500, color: 'var(--primary)' }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </Space>
      </Card>

      {/* Summary bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '13px' }}>
        <History size={16} />
        <span>Tổng số: <strong>{total}</strong> hoạt động được ghi nhận</span>
      </div>

      {/* Table */}
      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};

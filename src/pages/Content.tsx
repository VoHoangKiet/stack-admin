import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tabs, Tag, Button, Spin } from 'antd';
import { FileText, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';

export const Content: React.FC = () => {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [canvasTotal, setCanvasTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cvRes, chRes] = await Promise.all([
        apiClient.get('/admin/canvases', { params: { page: 1, size: 50 } }),
        apiClient.get('/admin/channels', { params: { page: 1, size: 50 } }),
      ]);
      setCanvases(cvRes.data.data || []);
      setCanvasTotal(cvRes.data.meta?.total || 0);
      setChannels(chRes.data.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canvasCols = [
    { title: 'ID', dataIndex: 'id', key: 'id', ellipsis: true, width: 80 },
    { title: 'Workspace', key: 'workspace', render: (_: any, r: any) => r.workspace?.name || '—' },
    { title: 'Ngày tạo', dataIndex: 'createdAt', render: (d: string) => new Date(d).toLocaleDateString('vi-VN') },
  ];

  const channelCols = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (t: string) => <Tag>{t}</Tag> },
    { title: 'Workspace', key: 'workspace', render: (_: any, r: any) => r.workspace?.name || '—' },
  ];

  const items = [
    { key: 'canvases', label: `Canvases (${canvasTotal})`, children: (
      <Table dataSource={canvases} columns={canvasCols} rowKey="id" loading={loading} pagination={false} scroll={{ x: 600 }} />
    )},
    { key: 'channels', label: `Channels (${channels.length})`, children: (
      <Table dataSource={channels} columns={channelCols} rowKey="id" loading={loading} pagination={false} scroll={{ x: 600 }} />
    )},
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Quản lý nội dung</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Canvases và Channels trên hệ thống.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>Làm mới</Button>
      </div>
      <Card bordered={false}><Tabs items={items} /></Card>
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tabs, Tag, Button, Row, Col, Avatar, Space } from 'antd';
import { FileText, MessageSquare, Hash, Lock, User, Users, Building2, RefreshCw, Globe } from 'lucide-react';
import apiClient from '../lib/api';

export const Content: React.FC = () => {
  const [canvases, setCanvases] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  
  // Pagination states
  const [canvasPage, setCanvasPage] = useState(1);
  const [canvasSize, setCanvasSize] = useState(10);
  const [canvasTotal, setCanvasTotal] = useState(0);

  const [channelPage, setChannelPage] = useState(1);
  const [channelSize, setChannelSize] = useState(10);
  const [channelTotal, setChannelTotal] = useState(0);

  const [activeTab, setActiveTab] = useState('canvases');
  const [loading, setLoading] = useState(true);

  const fetchCanvases = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/canvases', { params: { page, size } });
      setCanvases(res.data.data || []);
      setCanvasTotal(res.data.meta?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  const fetchChannels = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/channels', { params: { page, size } });
      setChannels(res.data.data || []);
      setChannelTotal(res.data.meta?.total || 0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchCanvases(canvasPage, canvasSize);
  }, [canvasPage, canvasSize, fetchCanvases]);

  useEffect(() => {
    fetchChannels(channelPage, channelSize);
  }, [channelPage, channelSize, fetchChannels]);

  const handleRefresh = () => {
    if (activeTab === 'canvases') {
      fetchCanvases(canvasPage, canvasSize);
    } else {
      fetchChannels(channelPage, channelSize);
    }
  };

  const activeCanvasesCount = canvases.filter(c => c.status === 'active').length;
  const publicChannelsCount = channels.filter(c => c.type === 'public').length;

  const canvasCols = [
    {
      title: 'Document / Canvas',
      key: 'title',
      render: (_: any, r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}
            icon={<FileText size={16} />}
          />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.title || 'Untitled'}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {r.description || 'No description'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Workspace',
      key: 'workspace',
      render: (_: any, r: any) => (
        <Space size={4}>
          <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{r.workspace?.name || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'active' ? 'success' : status === 'archived' ? 'warning' : 'default';
        return <Tag color={color}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Sharing Visibility',
      dataIndex: 'visibility',
      key: 'visibility',
      render: (visibility: string) => {
        let color = 'default';
        let icon = null;
        if (visibility === 'private') {
          color = 'volcano';
          icon = <Lock size={10} style={{ marginRight: 4 }} />;
        } else if (visibility === 'shared') {
          color = 'blue';
          icon = <Users size={10} style={{ marginRight: 4 }} />;
        } else if (visibility === 'public-workspace') {
          color = 'cyan';
          icon = <Globe size={10} style={{ marginRight: 4 }} />;
        }
        return (
          <Tag color={color} style={{ display: 'inline-flex', alignItems: 'center' }}>
            {icon}
            {visibility?.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(d).toLocaleDateString('en-US')}
        </span>
      ),
    },
  ];

  const channelCols = [
    {
      title: 'Chat Channel',
      key: 'name',
      render: (_: any, r: any) => {
        let icon = <Hash size={16} />;
        let iconColor = '#52c41a';
        let bgColor = '#f6ffed';

        if (r.type === 'private') {
          icon = <Lock size={16} />;
          iconColor = '#fa8c16';
          bgColor = '#fff7e6';
        } else if (r.type === 'dm') {
          icon = <User size={16} />;
          iconColor = '#1890ff';
          bgColor = '#e6f7ff';
        } else if (r.type === 'group_dm') {
          icon = <Users size={16} />;
          iconColor = '#722ed1';
          bgColor = '#f9f0ff';
        }

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              style={{ backgroundColor: bgColor, color: iconColor }}
              icon={icon}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.name || 'Direct Message'}</span>
              {r.isDefault && (
                <Tag color="green" style={{ fontSize: '10px', height: 18, lineHeight: '16px', margin: 0 }}>
                  Default
                </Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (t: string) => {
        let color = 'default';
        if (t === 'public') color = 'green';
        else if (t === 'private') color = 'orange';
        else if (t === 'dm') color = 'blue';
        else if (t === 'group_dm') color = 'purple';
        return <Tag color={color}>{t?.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Workspace',
      key: 'workspace',
      render: (_: any, r: any) => (
        <Space size={4}>
          <Building2 size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{r.workspace?.name || '—'}</span>
        </Space>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (d: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(d).toLocaleDateString('en-US')}
        </span>
      ),
    },
  ];

  const items = [
    {
      key: 'canvases',
      label: `Canvases (${canvasTotal})`,
      children: (
        <Table
          dataSource={canvases}
          columns={canvasCols}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            current: canvasPage,
            pageSize: canvasSize,
            total: canvasTotal,
            onChange: (page, size) => {
              setCanvasPage(page);
              setCanvasSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} documents`,
          }}
        />
      ),
    },
    {
      key: 'channels',
      label: `Channels (${channelTotal})`,
      children: (
        <Table
          dataSource={channels}
          columns={channelCols}
          rowKey="id"
          loading={loading}
          scroll={{ x: 700 }}
          pagination={{
            current: channelPage,
            pageSize: channelSize,
            total: channelTotal,
            onChange: (page, size) => {
              setChannelPage(page);
              setChannelSize(size);
            },
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total) => `Total ${total} channels`,
          }}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Content Management
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
            Monitor documents (Canvases) and chat channels (Channels) on the system.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          style={{ height: '40px', borderRadius: 'var(--radius-md)' }}
        >
          Refresh
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#e6f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1890ff' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{canvasTotal}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Canvases</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#f6ffed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#52c41a' }}>
                <FileText size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{activeCanvasesCount}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Active Canvases</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#f9f0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#722ed1' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{channelTotal}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total Channels</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff7e6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fa8c16' }}>
                <MessageSquare size={24} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}>{publicChannelsCount}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Public Channels</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card bordered={false} styles={{ body: { padding: '8px 24px 24px 24px' } }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={items} />
      </Card>
    </div>
  );
};

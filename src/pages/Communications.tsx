import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Tag, Button, Spin, Statistic, Row, Col } from 'antd';
import { Phone, RefreshCw } from 'lucide-react';
import apiClient from '../lib/api';

export const Communications: React.FC = () => {
  const [huddles, setHuddles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        apiClient.get('/admin/communications/huddles'),
        apiClient.get('/admin/communications/huddles/stats'),
      ]);
      setHuddles(hRes.data.data || []);
      setStats(sRes.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = [
    { title: 'Channel', dataIndex: 'channel_name', key: 'channel_name', render: (n: string) => n || '—' },
    { title: 'Created Date', dataIndex: 'createdAt', key: 'createdAt',
      render: (d: string) => d ? new Date(d).toLocaleString('en-US') : '—' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>Communications</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Call history and statistics.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>Refresh</Button>
      </div>

      {stats && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}><Card bordered={false}>
            <Statistic title="Calls (30 Days)" value={stats.totalCalls} prefix={<Phone size={18} />} />
          </Card></Col>
          <Col xs={12} sm={6}><Card bordered={false}>
            <Statistic title="Avg Duration" value={stats.avgDurationSeconds} suffix="s" />
          </Card></Col>
        </Row>
      )}

      <Card title="Call History" bordered={false} styles={{ body: { padding: 0 } }}>
        <Table dataSource={huddles} columns={columns} rowKey="id" loading={loading} pagination={false} />
      </Card>
    </div>
  );
};

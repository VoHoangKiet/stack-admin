import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Table, Tag, Button, Spin } from 'antd';
import { Activity, RefreshCw, Database, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import apiClient from '../lib/api';

export const Health: React.FC = () => {
  const [health, setHealth] = useState<any>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [h, e, p] = await Promise.all([
        apiClient.get('/admin/health'),
        apiClient.get('/admin/health/errors', { params: { period: '24h' } }),
        apiClient.get('/admin/health/performance', { params: { period: '7d' } }),
      ]);
      setHealth(h.data.data);
      setErrors(e.data.data?.errors || []);
      setPerformance(p.data.data?.data || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusDot = (status: string) => (
    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
      backgroundColor: status === 'healthy' ? '#10b981' : '#ef4444', marginRight: 8 }} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>System Health</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Monitor API performance and error rates.</p>
        </div>
        <Button icon={<RefreshCw size={16} />} onClick={fetchData}>Refresh</Button>
      </div>

      {health && (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Server size={24} style={{ color: '#fa8c16' }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>API Server</div>
                    <div style={{ fontWeight: 600 }}>{statusDot(health.api?.status)}{health.api?.status}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Uptime: {Math.floor((health.api?.uptime || 0) / 3600)}h</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={12} sm={6}>
              <Card bordered={false}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Database size={24} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Database</div>
                    <div style={{ fontWeight: 600 }}>{statusDot(health.database?.status)}{health.database?.status}</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {performance.length > 0 && (
        <Card title="API Latency (7 Days)" bordered={false}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={performance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })} />
              <YAxis unit="ms" />
              <Tooltip />
              <Line type="monotone" dataKey="avgDuration" stroke="#3b82f6" name="Avg duration (ms)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {errors.length > 0 && (
        <Card title="Top Errors (24h)" bordered={false}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={errors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="action" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {!loading && errors.length === 0 && performance.length === 0 && (
        <Card bordered={false}>
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <Activity size={48} style={{ marginBottom: 16 }} />
            <p>No health data available yet. Audit logs will populate over time.</p>
          </div>
        </Card>
      )}
    </div>
  );
};

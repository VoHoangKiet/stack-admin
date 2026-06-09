import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Progress, Tag, Button, Spin, Alert } from 'antd';
import {
  Users,
  UserCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Globe,
  Database,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../lib/api';

interface OverviewStats {
  totalUsers: number;
  totalUsersChange: number;
  activeUsers: number;
  activeUsersChange: number;
  activeUsersPeriod: string;
  systemUptime: number;
  systemUptimeChange: number;
  storageUsed: number;
  storageTotal: number;
  storageUnit: string;
  incidents: number;
  incidentsResolved: number;
  cpuUsage: number;
  apiLatency: number;
  apiLatencyUnit: string;
}

interface UserGrowthData {
  period: string;
  labels: string[];
  values: number[];
  totalNewUsers: number;
  average: number;
}

export const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [growth, setGrowth] = useState<UserGrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, growthRes] = await Promise.all([
        apiClient.get('/admin/stats/overview'),
        apiClient.get('/admin/stats/user-growth', { params: { period: 'week' } }),
      ]);
      setOverview(overviewRes.data.data);
      setGrowth(growthRes.data.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi tải dữ liệu"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={fetchData}>
            Thử lại
          </Button>
        }
      />
    );
  }

  const stats = overview
    ? [
        {
          title: 'Tổng số người dùng',
          value: overview.totalUsers.toLocaleString(),
          change: `${overview.totalUsersChange >= 0 ? '+' : ''}${overview.totalUsersChange}%`,
          isPositive: overview.totalUsersChange >= 0,
          icon: <Users size={24} style={{ color: '#fa8c16' }} />,
          bg: 'rgba(250, 140, 22, 0.1)',
          trendText: 'so với tháng trước',
        },
        {
          title: `Đang hoạt động (${overview.activeUsersPeriod})`,
          value: overview.activeUsers.toLocaleString(),
          change: `${overview.activeUsersChange >= 0 ? '+' : ''}${overview.activeUsersChange}%`,
          isPositive: overview.activeUsersChange >= 0,
          icon: <UserCheck size={24} style={{ color: '#10b981' }} />,
          bg: 'rgba(16, 185, 129, 0.1)',
          trendText: 'tổng số người dùng',
        },
        {
          title: 'Hiệu suất hệ thống',
          value: `${overview.systemUptime}%`,
          change: `+${overview.systemUptimeChange}%`,
          isPositive: true,
          icon: <Zap size={24} style={{ color: '#f59e0b' }} />,
          bg: 'rgba(245, 158, 11, 0.1)',
          trendText: 'Uptime tuần này',
        },
        {
          title: 'Sự cố ghi nhận',
          value: String(overview.incidents),
          change: `đã xử lý ${overview.incidentsResolved}/${overview.incidents}`,
          isPositive: overview.incidentsResolved === overview.incidents,
          icon: <AlertTriangle size={24} style={{ color: '#ef4444' }} />,
          bg: 'rgba(239, 68, 68, 0.1)',
          trendText: overview.incidentsResolved === overview.incidents ? 'đã xử lý xong' : 'còn tồn đọng',
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div
        className="animate-pulse-subtle"
        style={{
          padding: '32px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(250, 140, 22, 0.12) 0%, rgba(255, 156, 110, 0.05) 100%)',
          border: '1px solid rgba(250, 140, 22, 0.2)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>
            Chào mừng trở lại, Admin! 👋
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '15px' }}>
            Hệ thống đang hoạt động ổn định.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={fetchData}
          style={{
            height: '42px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        {stats.map((stat, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 500 }}>{stat.title}</span>
                  <h2 style={{ fontSize: '28px', fontWeight: 700, margin: '8px 0 0 0', color: 'var(--text-main)' }}>
                    {stat.value}
                  </h2>
                </div>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: stat.bg,
                  }}
                >
                  {stat.icon}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' }}>
                <span
                  style={{
                    color: stat.isPositive ? 'var(--success)' : 'var(--danger)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </span>
                <span style={{ color: 'var(--text-light)' }}>{stat.trendText}</span>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Charts & Diagnostics */}
      <Row gutter={[24, 24]}>
        {/* User Growth Chart */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Lượng người dùng mới ({growth?.period === 'week' ? 'tuần này' : growth?.period})</span>
                <Tag color="orange">Cập nhật trực tiếp</Tag>
              </div>
            }
            bordered={false}
          >
            {growth ? (
              <div
                style={{
                  height: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  marginTop: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    height: 200,
                    paddingBottom: 8,
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  {growth.values.map((val, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: 12 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{val}</div>
                      <div
                        style={{
                          width: '40%',
                          minWidth: '24px',
                          height: `${Math.max(val * 1.5, 4)}px`,
                          borderRadius: '4px 4px 0 0',
                          backgroundColor: 'var(--primary)',
                          opacity: 0.85,
                          transition: 'all var(--transition-normal)',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                        onMouseOver={(e) => {
                          (e.target as HTMLDivElement).style.opacity = '1';
                          (e.target as HTMLDivElement).style.transform = 'scaleY(1.03)';
                        }}
                        onMouseOut={(e) => {
                          (e.target as HTMLDivElement).style.opacity = '0.85';
                          (e.target as HTMLDivElement).style.transform = 'scaleY(1)';
                        }}
                      />
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-main)' }}>{growth.labels[i]}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, fontSize: '13px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
                    <span>
                      Người dùng mới (Tổng: {growth.totalNewUsers}, TB: {growth.average}/ngày)
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Không có dữ liệu
              </div>
            )}
          </Card>
        </Col>

        {/* Server Health */}
        <Col xs={24} lg={8}>
          <Card title="Trạng thái hệ thống" bordered={false} style={{ height: '100%' }}>
            {overview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <Database size={16} style={{ color: 'var(--primary)' }} />
                      Dung lượng cơ sở dữ liệu
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {overview.storageUsed} {overview.storageUnit} / {overview.storageTotal} {overview.storageUnit}
                    </span>
                  </div>
                  <Progress
                    percent={Math.round((overview.storageUsed / overview.storageTotal) * 100)}
                    status="active"
                    strokeColor={{ '0%': '#52c41a', '100%': '#fa8c16' }}
                    showInfo={false}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <Zap size={16} style={{ color: '#eab308' }} />
                      CPU Usage
                    </span>
                    <span style={{ fontWeight: 600 }}>{overview.cpuUsage}%</span>
                  </div>
                  <Progress percent={overview.cpuUsage} status="active" strokeColor="#f59e0b" showInfo={false} />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                      <Globe size={16} style={{ color: '#3b82f6' }} />
                      API Latency
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {overview.apiLatency}ms
                    </span>
                  </div>
                  <Progress
                    percent={Math.min(Math.round((overview.apiLatency / 100) * 100), 100)}
                    status="active"
                    strokeColor="#3b82f6"
                    showInfo={false}
                  />
                </div>

                <div
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    marginTop: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: 'var(--success)',
                        boxShadow: '0 0 8px var(--success)',
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Cổng API Gateway: Trực Tuyến</span>
                  </div>
                  <p style={{ margin: '6px 0 0 18px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Độ trễ trung bình: <strong style={{ color: 'var(--success)' }}>{overview.apiLatency}ms</strong>. Hệ thống{' '}
                    {overview.systemUptime}% uptime.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

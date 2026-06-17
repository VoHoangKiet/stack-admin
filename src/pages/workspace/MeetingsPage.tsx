import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Table,
  Card,
  Avatar,
  Progress,
  Tooltip,
  Button,
  Modal,
  Spin,
  Empty,
  Select,
  Statistic,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  PhoneCall,
  Clock,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw,
  Hash,
  TrendingUp,
  ChevronRight,
  Calendar,
  User,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { useWorkspace } from '../../lib/workspace-context';

interface ParticipantStat {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
  leftAt?: string;
  durationSeconds: number;
  participationPercent: number;
  micEnabled: boolean;
  cameraEnabled: boolean;
}

interface HuddleCallSummary {
  id: string;
  channelId: string;
  channelName: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  participantCount: number;
  createdBy: { id: string; name: string; email: string };
}

interface HuddleCallDetail extends HuddleCallSummary {
  participants: ParticipantStat[];
  avgParticipationPercent: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmtDuration = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return rm > 0 ? `${h}h ${rm}m` : `${h}h`;
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtTimeShort = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });

const timeAgo = (iso: string): string => {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';
  const diffSec = Math.round(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.round(diffHr / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return fmtTimeShort(iso);
};

const participationColor = (pct: number) => {
  if (pct >= 75) return '#22c55e';
  if (pct >= 40) return '#f59e0b';
  return '#ef4444';
};

const durationColor = (seconds: number) => {
  if (seconds < 300) return '#64748b';    // <5m  → gray
  if (seconds < 900) return '#22c55e';    // <15m → green
  if (seconds < 3600) return '#f59e0b';   // <1h  → amber
  return '#ef4444';                        // ≥1h  → red
};

const durationLabel = (seconds: number) => {
  if (seconds < 300) return 'Quick chat';
  if (seconds < 900) return 'Brief';
  if (seconds < 3600) return 'Normal';
  return 'Long';
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const ParticipantRow: React.FC<{ p: ParticipantStat; callDuration: number }> = ({ p, callDuration }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 0',
    borderBottom: '1px solid var(--border-color)',
  }}>
    <Avatar
      size={32}
      src={p.avatar}
      style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 600, flexShrink: 0 }}
    >
      {p.name.charAt(0).toUpperCase()}
    </Avatar>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {p.name}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.email}</div>
    </div>

    {/* Duration */}
    <div style={{ width: 60, textAlign: 'right', flexShrink: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)' }}>{fmtDuration(p.durationSeconds)}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>joined</div>
    </div>

    {/* Participation bar */}
    <div style={{ width: 120, flexShrink: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>participation</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: participationColor(p.participationPercent) }}>
          {p.participationPercent}%
        </span>
      </div>
      <Progress
        percent={p.participationPercent}
        size="small"
        showInfo={false}
        strokeColor={participationColor(p.participationPercent)}
        trailColor="var(--border-color)"
      />
    </div>

    {/* Mic / Camera */}
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <Tooltip title={p.micEnabled ? 'Mic on' : 'Mic off'}>
        {p.micEnabled
          ? <Mic size={13} style={{ color: '#22c55e' }} />
          : <MicOff size={13} style={{ color: '#ef4444' }} />}
      </Tooltip>
      <Tooltip title={p.cameraEnabled ? 'Camera on' : 'Camera off'}>
        {p.cameraEnabled
          ? <Video size={13} style={{ color: '#22c55e' }} />
          : <VideoOff size={13} style={{ color: '#ef4444' }} />}
      </Tooltip>
    </div>
  </div>
);

// ─── Main page ───────────────────────────────────────────────────────────────

export const MeetingsPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { activeWorkspace } = useWorkspace();

  const [calls, setCalls] = useState<HuddleCallSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [channelFilter, setChannelFilter] = useState<string | undefined>();

  const [detail, setDetail] = useState<HuddleCallDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHistory = useCallback(async (p = 1) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const params: Record<string, any> = { page: p, take: 15 };
      if (channelFilter) params.channelId = channelFilter;

      const res = await apiClient.get(`/v1/admin/workspaces/${workspaceId}/huddle-history`, {
        params,
      });
      setCalls(res.data.data || []);
      setTotal(res.data.meta?.total || 0);
    } catch {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, channelFilter]);

  useEffect(() => {
    fetchHistory(1);
    setPage(1);
  }, [fetchHistory]);

  // Compute stats from current page data
  const pageStats = useMemo(() => {
    if (calls.length === 0) return null;
    const avgDuration = Math.round(calls.reduce((s, c) => s + c.durationSeconds, 0) / calls.length);
    const totalParticipants = calls.reduce((s, c) => s + c.participantCount, 0);
    const maxDuration = Math.max(...calls.map(c => c.durationSeconds));
    return { avgDuration, totalParticipants, maxDuration };
  }, [calls]);

  // Unique channels for filter dropdown
  const channelOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { label: string; value: string }[] = [];
    for (const c of calls) {
      if (!seen.has(c.channelId)) {
        seen.add(c.channelId);
        opts.push({ label: c.channelName || 'Unknown', value: c.channelId });
      }
    }
    return opts;
  }, [calls]);

  const openDetail = async (callId: string) => {
    setModalOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiClient.get(`/v1/admin/workspaces/${workspaceId}/huddle-history/${callId}`);
      setDetail(res.data);
    } catch {
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: 'Channel',
      dataIndex: 'channelName',
      width: 160,
      render: (name: string, record: HuddleCallSummary) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: record.channelId ? '#3b82f6' : '#64748b',
            flexShrink: 0,
          }} />
          <Hash size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
            {name || 'Unknown'}
          </span>
        </div>
      ),
    },
    {
      title: 'Started',
      dataIndex: 'startedAt',
      width: 180,
      sorter: (a: HuddleCallSummary, b: HuddleCallSummary) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
      defaultSortOrder: 'descend' as const,
      render: (d: string) => (
        <Tooltip title={fmtTime(d)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
              {timeAgo(d)}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              <Calendar size={10} style={{ marginRight: 3, verticalAlign: -1 }} />
              {fmtTimeShort(d)}
            </span>
          </div>
        </Tooltip>
      ),
    },
    {
      title: 'Duration',
      dataIndex: 'durationSeconds',
      width: 150,
      sorter: (a: HuddleCallSummary, b: HuddleCallSummary) => a.durationSeconds - b.durationSeconds,
      render: (s: number) => {
        const color = durationColor(s);
        const barWidth = Math.min(100, Math.round((s / 7200) * 100)); // 2h = 100%
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                {fmtDuration(s)}
              </span>
              <Tag style={{
                fontSize: 10,
                fontWeight: 600,
                color,
                background: `${color}18`,
                border: 'none',
                borderRadius: 20,
                margin: 0,
                lineHeight: '18px',
                padding: '0 8px',
              }}>
                {durationLabel(s)}
              </Tag>
            </div>
            <div style={{
              height: 4,
              width: '100%',
              maxWidth: 120,
              background: 'var(--border-color)',
              borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${barWidth}%`,
                background: color,
                borderRadius: 4,
                transition: 'width 0.3s',
              }} />
            </div>
          </div>
        );
      },
    },
    {
      title: 'Participants',
      dataIndex: 'participantCount',
      width: 110,
      sorter: (a: HuddleCallSummary, b: HuddleCallSummary) => a.participantCount - b.participantCount,
      render: (n: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={12} style={{ color: 'var(--text-muted)' }} />
          <span style={{
            fontSize: 13,
            fontWeight: 700,
            color: n >= 5 ? '#22c55e' : n >= 3 ? '#f59e0b' : 'var(--text-main)',
          }}>
            {n}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {n === 1 ? 'person' : 'people'}
          </span>
        </div>
      ),
    },
    {
      title: 'Started by',
      dataIndex: 'createdBy',
      width: 170,
      render: (by: HuddleCallSummary['createdBy']) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            size={26}
            style={{ background: 'var(--primary)', fontSize: 11, fontWeight: 600, flexShrink: 0 }}
          >
            {by.name?.charAt(0)?.toUpperCase() || '?'}
          </Avatar>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>
              {by.name}
            </span>
            {by.email && (
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                {by.email}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 48,
      render: (_: any, record: HuddleCallSummary) => (
        <Button
          type="text"
          size="small"
          icon={<ChevronRight size={14} />}
          onClick={() => openDetail(record.id)}
          style={{ color: 'var(--text-muted)' }}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            <PhoneCall size={20} style={{ marginRight: 8, verticalAlign: -3, color: 'var(--primary)' }} />
            Huddle History
          </h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {activeWorkspace?.name} · {total} session{total !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {channelOptions.length > 1 && (
            <Select
              placeholder="All channels"
              value={channelFilter}
              onChange={setChannelFilter}
              allowClear
              style={{ width: 180 }}
              options={channelOptions}
              suffixIcon={<Hash size={13} />}
              onClear={() => setChannelFilter(undefined)}
            />
          )}
          <Button
            icon={<RefreshCw size={14} />}
            onClick={() => fetchHistory(page)}
            style={{ height: 36, borderRadius: 8, fontSize: 13, border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {pageStats && (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total Sessions</span>}
                value={total}
                prefix={<BarChart3 size={16} style={{ color: 'var(--primary)', marginRight: 4 }} />}
                valueStyle={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Avg Duration</span>}
                value={fmtDuration(pageStats.avgDuration)}
                prefix={<Clock size={16} style={{ color: '#f59e0b', marginRight: 4 }} />}
                valueStyle={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Participants (this page)</span>}
                value={pageStats.totalParticipants}
                prefix={<Users size={16} style={{ color: '#22c55e', marginRight: 4 }} />}
                valueStyle={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card bordered={false} style={{ borderRadius: 12, border: '1px solid var(--border-color)', height: '100%' }}>
              <Statistic
                title={<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Longest Session</span>}
                value={fmtDuration(pageStats.maxDuration)}
                prefix={<Zap size={16} style={{ color: '#ef4444', marginRight: 4 }} />}
                valueStyle={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Table */}
      <Card
        bordered={false}
        style={{ border: '1px solid var(--border-color)', borderRadius: 12 }}
        styles={{ body: { padding: 0 } }}
      >
        {calls.length === 0 && !loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <Empty
              image={<PhoneCall size={36} style={{ color: 'var(--border-color)' }} />}
              imageStyle={{ height: 48, display: 'flex', justifyContent: 'center' }}
              description={
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  {channelFilter
                    ? 'No huddle sessions for this channel'
                    : 'No huddle sessions found for this workspace'}
                </span>
              }
            >
              {channelFilter && (
                <Button type="link" onClick={() => setChannelFilter(undefined)} style={{ padding: 0 }}>
                  Clear filter
                </Button>
              )}
            </Empty>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={calls}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize: 15,
              total,
              onChange: (p) => { setPage(p); fetchHistory(p); },
              showSizeChanger: false,
              style: { padding: '12px 18px' },
            }}
            style={{ padding: '0 4px' }}
          />
        )}
      </Card>

      {/* Detail modal */}
      <Modal
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={680}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PhoneCall size={16} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>Huddle Detail</span>
            {detail && (
              <Tag style={{ marginLeft: 8, fontSize: 11, borderRadius: 20, border: 'none' }}>
                {detail.channelName}
              </Tag>
            )}
          </div>
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        ) : detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
            {/* Call meta */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}>
              {[
                { label: 'Channel', value: `#${detail.channelName}`, icon: <Hash size={13} />, color: '#3b82f6' },
                { label: 'Duration', value: fmtDuration(detail.durationSeconds), icon: <Clock size={13} />, color: '#f59e0b' },
                { label: 'Participants', value: String(detail.participantCount), icon: <Users size={13} />, color: '#22c55e' },
                { label: 'Avg. presence', value: `${detail.avgParticipationPercent}%`, icon: <TrendingUp size={13} />, color: '#8b5cf6' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{
                  background: 'var(--bg-app)',
                  borderRadius: 10,
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>
                    <span style={{ color }}>{icon}</span> {label}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Metadata footer */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--bg-app)',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar size={22} style={{ background: 'var(--primary)', fontSize: 10, fontWeight: 600 }}>
                  {detail.createdBy.name?.charAt(0)?.toUpperCase() || '?'}
                </Avatar>
                <span style={{ fontSize: 12, color: 'var(--text-main)', fontWeight: 500 }}>
                  {detail.createdBy.name}
                </span>
                {detail.createdBy.email && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    · {detail.createdBy.email}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Started {fmtTime(detail.startedAt)}
                {detail.endedAt && <> · Ended {fmtTime(detail.endedAt)}</>}
              </span>
            </div>

            {/* Participant list */}
            <div>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <Users size={13} />
                Participants ({detail.participants.length})
              </div>
              <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: 10,
                padding: '0 14px',
              }}>
                {detail.participants.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 16 }}>
                    No participant data
                  </div>
                ) : (
                  detail.participants.map((p, i) => (
                    <div key={p.userId}>
                      <ParticipantRow p={p} callDuration={detail.durationSeconds} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
            Failed to load detail
          </div>
        )}
      </Modal>
    </div>
  );
};

import React, { useState, useCallback, useEffect } from 'react';
import {
  Table,
  Avatar,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Popconfirm,
  message,
  Tooltip,
  Card,
  Statistic,
} from 'antd';
import {
  Users,
  UserPlus,
  RefreshCw,
  Trash2,
  Mail,
  ClipboardList,
  Crown,
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import { useWorkspace } from '../../lib/workspace-context';

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

interface WorkspaceRole {
  id: string;
  name: string;
}

export const MembersPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { capabilities, activeWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string | undefined>();
  const [inviteLoading, setInviteLoading] = useState(false);

  const fetchMembers = useCallback(
    async (p = page, ps = pageSize, s = search) => {
      if (!workspaceId) return;
      setLoading(true);
      try {
        const res = await apiClient.get(`/workspaces/${workspaceId}/members`, {
          params: { page: p, take: ps, search: s },
        });
        setMembers(res.data.data || []);
        setTotal(res.data.meta?.itemCount || 0);
      } catch {
        setMembers([]);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, page, pageSize, search]
  );

  const fetchRoles = useCallback(async () => {
    if (!workspaceId) return;
    setRolesLoading(true);
    try {
      const res = await apiClient.get(`/admin/workspaces/${workspaceId}/roles`);
      setRoles(res.data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchMembers(1, 10, '');
    fetchRoles();
  }, [workspaceId]);

  const handleRoleChange = async (memberId: string, roleId: string, memberName: string, roleName: string) => {
    Modal.confirm({
      title: 'Confirm Role Change',
      content: `Change role of "${memberName}" to "${roleName}"?`,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiClient.put(`/admin/workspace-members/${memberId}/role`, { roleId });
          message.success('Role updated');
          fetchMembers(page, pageSize, search);
        } catch (err: any) {
          message.error(err.response?.data?.message || 'Failed to update role');
        }
      },
    });
  };

  const handleRemove = async (member: WorkspaceMember) => {
    try {
      await apiClient.delete(`/admin/workspace-members/${member.id}`);
      message.success(`${member.name} removed from workspace`);
      fetchMembers(page, pageSize, search);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail || !inviteRole || !workspaceId) return;
    setInviteLoading(true);
    try {
      await apiClient.post(`/workspaces/${workspaceId}/invite`, {
        email: inviteEmail,
        roleId: inviteRole,
      });
      message.success(`Invitation sent to ${inviteEmail}`);
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole(undefined);
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to send invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const activeCount = members.filter((m) => m.status === 'active').length;
  const ownerCount = members.filter((m) => m.roleName.toLowerCase() === 'owner').length;

  const filteredMembers = roleFilter
    ? members.filter((m) => m.roleId === roleFilter || m.roleName.toLowerCase() === roleFilter)
    : members;

  const columns = [
    {
      title: 'Member',
      dataIndex: 'name',
      render: (name: string, record: WorkspaceMember) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar
            size={34}
            src={record.avatar || undefined}
            style={{
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 600,
              flexShrink: 0,
              fontSize: 13,
            }}
          >
            {name?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: 14 }}>{name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={11} />
              {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'roleName',
      width: 180,
      render: (roleName: string, record: WorkspaceMember) => {
        const isOwner = roleName.toLowerCase() === 'owner';
        if (isOwner) {
          return (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#fa8c16',
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              <Crown size={13} /> owner
            </span>
          );
        }
        return (
          <Select
            value={record.roleId}
            style={{ width: 140 }}
            size="small"
            disabled={!capabilities.canUpdateMemberRole}
            loading={rolesLoading}
            options={roles
              .filter((r) => r.name.toLowerCase() !== 'owner')
              .map((r) => ({ label: r.name, value: r.id }))}
            onChange={(val) => {
              const role = roles.find((r) => r.id === val);
              handleRoleChange(record.id, val, record.name, role?.name || '');
            }}
          />
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 110,
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : 'default'}
          text={
            <span style={{ fontSize: 13, color: status === 'active' ? '#22c55e' : 'var(--text-muted)' }}>
              {status}
            </span>
          }
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'joinedAt',
      width: 120,
      render: (date: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          {date ? new Date(date).toLocaleDateString('vi-VN') : '—'}
        </span>
      ),
    },
    {
      title: 'Tasks',
      key: 'tasks',
      width: 80,
      render: (_: any, record: WorkspaceMember) => (
        <Tooltip title="View tasks assigned to this member">
          <Button
            type="text"
            size="small"
            icon={<ClipboardList size={14} />}
            onClick={() => navigate(`/workspaces/${workspaceId}/tasks?assigneeId=${record.userId}`)}
            style={{ color: 'var(--text-muted)' }}
          />
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'action',
      width: 56,
      render: (_: any, record: WorkspaceMember) => {
        const isOwner = record.roleName.toLowerCase() === 'owner';
        if (isOwner) return null;
        return (
          <Popconfirm
            title={`Remove ${record.name} from workspace?`}
            onConfirm={() => handleRemove(record)}
            okText="Remove"
            cancelText="Cancel"
            disabled={!capabilities.canRemoveMembers}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Remove member">
              <Button
                type="text"
                size="small"
                danger
                disabled={!capabilities.canRemoveMembers}
                icon={<Trash2 size={14} />}
              />
            </Tooltip>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Members</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {activeWorkspace?.name} · {total} member{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            icon={<RefreshCw size={15} />}
            onClick={() => fetchMembers(1, pageSize, search)}
            style={{ height: 38, borderRadius: 9 }}
          />
          {capabilities.canInviteMembers && (
            <Button
              type="primary"
              icon={<UserPlus size={14} />}
              onClick={() => setInviteOpen(true)}
              style={{
                height: 36,
                borderRadius: 8,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
              }}
            >
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
        {[
          {
            title: 'Total Members',
            value: total,
            iconBg: 'rgba(250,140,22,0.08)',
            icon: <Users size={16} style={{ color: 'var(--primary)' }} />,
          },
          {
            title: 'Active',
            value: activeCount,
            iconBg: 'rgba(34,197,94,0.08)',
            icon: <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />,
          },
          {
            title: 'Owners',
            value: ownerCount,
            iconBg: 'rgba(250,140,22,0.08)',
            icon: <Crown size={16} style={{ color: '#d46b08' }} />,
          },
        ].map((stat) => (
          <Card
            key={stat.title}
            bordered={false}
            style={{ borderRadius: 10, border: '1px solid var(--border-color)' }}
            styles={{ body: { padding: '14px 16px' } }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: stat.iconBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {stat.icon}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                  {stat.title}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters + Table */}
      <Card bordered={false} style={{ borderRadius: 16, border: '1px solid var(--border-color)' }} styles={{ body: { padding: 0 } }}>
        {/* Filter bar */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-color)',
            flexWrap: 'wrap',
          }}
        >
          <Input.Search
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={(val) => {
              setPage(1);
              fetchMembers(1, pageSize, val);
            }}
            style={{ maxWidth: 280 }}
            allowClear
          />
          <Select
            placeholder="Filter by role"
            value={roleFilter}
            onChange={setRoleFilter}
            allowClear
            style={{ width: 160 }}
            options={roles.map((r) => ({ label: r.name, value: r.id }))}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredMembers}
          rowKey="id"
          loading={loading}
          style={{ padding: '0 4px' }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => {
              setPage(p);
              setPageSize(ps);
              fetchMembers(p, ps, search);
            },
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
            style: { padding: '12px 18px' },
          }}
        />
      </Card>

      {/* Invite Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserPlus size={18} style={{ color: 'var(--primary)' }} />
            Invite Member
          </div>
        }
        open={inviteOpen}
        onCancel={() => setInviteOpen(false)}
        onOk={handleInvite}
        okText="Send Invite"
        confirmLoading={inviteLoading}
        okButtonProps={{ disabled: !inviteEmail || !inviteRole }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <Input
              prefix={<Mail size={14} style={{ color: 'var(--text-muted)' }} />}
              placeholder="member@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              type="email"
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', display: 'block', marginBottom: 6 }}>
              Assign role
            </label>
            <Select
              placeholder="Select a role"
              value={inviteRole}
              onChange={setInviteRole}
              style={{ width: '100%' }}
              options={roles
                .filter((r) => r.name.toLowerCase() !== 'owner')
                .map((r) => ({ label: r.name, value: r.id }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

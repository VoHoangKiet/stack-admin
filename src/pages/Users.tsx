import React, { useState, useEffect, useCallback } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Popconfirm,
  Card,
  Avatar,
  Tooltip,
} from 'antd';
import { Search, UserPlus, Edit2, Trash2, Mail, Lock, RefreshCw, UserX, UserCheck } from 'lucide-react';
import apiClient from '../lib/api';

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar?: string;
  isEmailVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [form] = Form.useForm();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, take: pageSize };
      if (searchText) params.search = searchText;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await apiClient.get('/users', { params });
      setUsers(res.data.data);
      setTotal(res.data.meta?.itemCount || 0);
    } catch (err: any) {
      message.error('Failed to load user list');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchText, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle debounced search
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    setPage(1);
  };

  // Open Create/Edit modal
  const openModal = (user: UserItem | null = null) => {
    setEditingUser(user);
    if (user) {
      form.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      });
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setModalLoading(true);

      if (editingUser) {
        // Update
        await apiClient.patch(`/users/${editingUser.id}`, values);
        message.success('User updated successfully!');
      } else {
        // Create
        await apiClient.post('/users', values);
        message.success('User created successfully!');
      }

      setIsModalOpen(false);
      form.resetFields();
      fetchUsers();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else if (err.errorFields) {
        // Form validation error - ignore
      } else {
        message.error('An error occurred. Please try again.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/users/${id}`);
      message.success('User deleted from the system!');
      fetchUsers();
    } catch {
      message.error('Failed to delete user');
    }
  };

  // Reset password
  const handleResetPassword = async (id: string) => {
    try {
      await apiClient.patch(`/users/reset-password/${id}`);
      message.success('Password reset to default!');
    } catch {
      message.error('Failed to reset password');
    }
  };

  // Update single field of user
  const handleUpdateUserField = async (record: UserItem, fields: Partial<UserItem>) => {
    try {
      const payload = {
        name: record.name,
        email: record.email,
        phone: record.phone,
        role: record.role,
        status: record.status,
        ...fields
      };
      await apiClient.patch(`/users/${record.id}`, payload);
      message.success('Information updated successfully!');
      fetchUsers();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Failed to update user information');
      }
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: UserItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            src={record.avatar || undefined}
            style={{
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontWeight: 600,
              verticalAlign: 'middle',
            }}
          >
            {text?.charAt(0)?.toUpperCase()}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{text}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Mail size={12} /> {record.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: UserItem) => (
        <Select
          value={role}
          onChange={(newRole) => handleUpdateUserField(record, { role: newRole })}
          style={{ width: 150 }}
          variant="borderless"
          popupClassName="role-select-dropdown"
          options={[
            { value: 'ADMIN', label: <Tag color="purple" style={{ borderRadius: '6px', margin: 0 }}>Administrator</Tag> },
            { value: 'MODERATOR', label: <Tag color="cyan" style={{ borderRadius: '6px', margin: 0 }}>Moderator</Tag> },
            { value: 'USER', label: <Tag color="blue" style={{ borderRadius: '6px', margin: 0 }}>User</Tag> },
          ]}
        />
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const active = status === 'ACTIVE';
        const blocked = status === 'BLOCKED';
        return (
          <Tag color={active ? 'success' : blocked ? 'error' : 'warning'} style={{ borderRadius: '6px' }}>
            {status === 'ACTIVE' ? 'Active' : status === 'BLOCKED' ? 'Blocked' : 'Pending Verification'}
          </Tag>
        );
      },
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{text || '—'}</span>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(text).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: UserItem) => {
        const isActive = record.status === 'ACTIVE';
        const isBlocked = record.status === 'BLOCKED';

        return (
          <Space size="small">
            <Button
              type="text"
              icon={<Edit2 size={15} style={{ color: 'var(--primary)' }} />}
              onClick={() => openModal(record)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            />
            {isActive ? (
              <Popconfirm
                title="Block Account"
                description="Are you sure you want to block this account? The user will not be able to log in."
                onConfirm={() => handleUpdateUserField(record, { status: 'BLOCKED' })}
                okText="Block"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  icon={<UserX size={15} style={{ color: '#ef4444' }} />}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Popconfirm>
            ) : isBlocked ? (
              <Popconfirm
                title="Unblock Account"
                description="Unblock this user account?"
                onConfirm={() => handleUpdateUserField(record, { status: 'ACTIVE' })}
                okText="Unblock"
                cancelText="Cancel"
              >
                <Button
                  type="text"
                  icon={<UserCheck size={15} style={{ color: '#22c55e' }} />}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Popconfirm>
            ) : (
              <Button
                type="text"
                disabled
                icon={<UserX size={15} style={{ color: 'var(--text-light)' }} />}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            )}
            <Popconfirm
              title="Reset Password"
              description="Reset the user password to default?"
              onConfirm={() => handleResetPassword(record.id)}
              okText="Reset"
              cancelText="Cancel"
            >
              <Button
                type="text"
                icon={<Lock size={15} style={{ color: '#f59e0b' }} />}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Popconfirm>
            {isActive ? (
              <Tooltip title="Cannot delete an active user. Please block the account first.">
                <Button
                  type="text"
                  disabled
                  danger
                  icon={<Trash2 size={15} />}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}
                />
              </Tooltip>
            ) : (
              <Popconfirm
                title="Delete User"
                description="Are you sure you want to delete this user?"
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button
                  type="text"
                  danger
                  icon={<Trash2 size={15} />}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            User Management
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            View, manage, and assign permissions to member accounts.
          </p>
        </div>
        <Space>
          <Button
            icon={<RefreshCw size={16} />}
            onClick={fetchUsers}
            style={{ height: '40px', borderRadius: 'var(--radius-md)' }}
          />
          <Button
            type="primary"
            icon={<UserPlus size={16} />}
            onClick={() => openModal(null)}
            style={{
              height: '40px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Add User
          </Button>
        </Space>
      </div>

      {/* Filter bar */}
      <Card bordered={false}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)', zIndex: 1 }} />
            <Input
              placeholder="Search by name or email..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <Select
            placeholder="Filter by Role"
            style={{ width: '160px', height: '40px' }}
            allowClear
            onChange={(val) => { setRoleFilter(val || null); setPage(1); }}
            options={[
              { value: 'ADMIN', label: 'Administrator' },
              { value: 'MODERATOR', label: 'Moderator' },
              { value: 'USER', label: 'User' },
            ]}
          />

          <Select
            placeholder="Filter by Status"
            style={{ width: '160px', height: '40px' }}
            allowClear
            onChange={(val) => { setStatusFilter(val || null); setPage(1); }}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'BLOCKED', label: 'Blocked' },
              { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
            ]}
          />

          {(searchText || roleFilter || statusFilter) && (
            <Button
              type="text"
              onClick={() => {
                setSearchText('');
                setRoleFilter(null);
                setStatusFilter(null);
                setPage(1);
              }}
              style={{ fontWeight: 500, color: 'var(--primary)' }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </Card>      {/* Table */}
      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          style={{ overflowX: 'auto' }}
        />
      </Card>

      {/* Add / Edit User Modal */}
      <Modal
        title={editingUser ? 'Edit User Information' : 'Add New User'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? 'Update' : 'Add'}
        cancelText="Cancel"
        confirmLoading={modalLoading}
      >
        <Form
          form={form}
          layout="vertical"
          name="userForm"
          style={{ marginTop: 20 }}
          initialValues={{ role: 'USER' }}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name!' }]}
          >
            <Input placeholder="E.g., John Doe" style={{ height: '40px' }} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email!' },
              { type: 'email', message: 'Invalid email address format!' },
            ]}
          >
            <Input placeholder="E.g., name@example.com" style={{ height: '40px' }} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="phone"
              label="Phone Number"
            >
              <Input placeholder="E.g., 0987654321" style={{ height: '40px' }} />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="System Role"
            rules={[{ required: true, message: 'Please select system role!' }]}
          >
            <Select
              style={{ height: '40px' }}
              options={[
                { value: 'ADMIN', label: 'Administrator' },
                { value: 'MODERATOR', label: 'Moderator' },
                { value: 'USER', label: 'User' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

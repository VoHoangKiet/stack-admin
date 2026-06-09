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
      setTotal(res.data.meta?.total || 0);
    } catch (err: any) {
      message.error('Không thể tải danh sách người dùng');
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
        message.success('Cập nhật thông tin người dùng thành công!');
      } else {
        // Create
        await apiClient.post('/users', values);
        message.success('Thêm người dùng mới thành công!');
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
        message.error('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } finally {
      setModalLoading(false);
    }
  };

  // Delete user
  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/users/${id}`);
      message.success('Đã xóa người dùng khỏi hệ thống!');
      fetchUsers();
    } catch {
      message.error('Không thể xóa người dùng');
    }
  };

  // Reset password
  const handleResetPassword = async (id: string) => {
    try {
      await apiClient.patch(`/users/reset-password/${id}`);
      message.success('Đã reset mật khẩu về mặc định!');
    } catch {
      message.error('Không thể reset mật khẩu');
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
      message.success('Cập nhật thông tin thành công!');
      fetchUsers();
    } catch (err: any) {
      if (err.response?.data?.message) {
        message.error(err.response.data.message);
      } else {
        message.error('Không thể cập nhật thông tin người dùng');
      }
    }
  };

  const columns = [
    {
      title: 'Người dùng',
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
      title: 'Vai trò',
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
            { value: 'ADMIN', label: <Tag color="purple" style={{ borderRadius: '6px', margin: 0 }}>Quản trị viên</Tag> },
            { value: 'MODERATOR', label: <Tag color="cyan" style={{ borderRadius: '6px', margin: 0 }}>Biên tập viên</Tag> },
            { value: 'USER', label: <Tag color="blue" style={{ borderRadius: '6px', margin: 0 }}>Người dùng</Tag> },
          ]}
        />
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const active = status === 'ACTIVE';
        const blocked = status === 'BLOCKED';
        return (
          <Tag color={active ? 'success' : blocked ? 'error' : 'warning'} style={{ borderRadius: '6px' }}>
            {status === 'ACTIVE' ? 'Đang hoạt động' : status === 'BLOCKED' ? 'Tạm khóa' : 'Chờ xác thực'}
          </Tag>
        );
      },
    },
    {
      title: 'SĐT',
      dataIndex: 'phone',
      key: 'phone',
      render: (text: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{text || '—'}</span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(text).toLocaleDateString('vi-VN')}
        </span>
      ),
    },
    {
      title: 'Hành động',
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
                title="Khóa tài khoản"
                description="Bạn có chắc chắn muốn khóa tài khoản này không? Người dùng sẽ không thể đăng nhập."
                onConfirm={() => handleUpdateUserField(record, { status: 'BLOCKED' })}
                okText="Khóa"
                cancelText="Hủy"
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
                title="Mở khóa tài khoản"
                description="Mở khóa tài khoản cho người dùng này?"
                onConfirm={() => handleUpdateUserField(record, { status: 'ACTIVE' })}
                okText="Mở khóa"
                cancelText="Hủy"
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
              title="Reset mật khẩu"
              description="Reset mật khẩu người dùng về mặc định?"
              onConfirm={() => handleResetPassword(record.id)}
              okText="Reset"
              cancelText="Hủy"
            >
              <Button
                type="text"
                icon={<Lock size={15} style={{ color: '#f59e0b' }} />}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              />
            </Popconfirm>
            {isActive ? (
              <Tooltip title="Không thể xóa người dùng đang hoạt động. Vui lòng khóa tài khoản trước.">
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
                title="Xóa người dùng"
                description="Bạn có chắc chắn muốn xóa người dùng này không?"
                onConfirm={() => handleDelete(record.id)}
                okText="Xóa"
                cancelText="Hủy"
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
            Quản lý người dùng
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            Xem danh sách, phân quyền và quản lý tài khoản thành viên.
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
            Thêm người dùng
          </Button>
        </Space>
      </div>

      {/* Filter bar */}
      <Card bordered={false}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-light)', zIndex: 1 }} />
            <Input
              placeholder="Tìm theo tên hoặc email..."
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              style={{ paddingLeft: '36px', height: '40px' }}
            />
          </div>

          <Select
            placeholder="Lọc vai trò"
            style={{ width: '160px', height: '40px' }}
            allowClear
            onChange={(val) => { setRoleFilter(val || null); setPage(1); }}
            options={[
              { value: 'ADMIN', label: 'Quản trị viên' },
              { value: 'MODERATOR', label: 'Biên tập viên' },
              { value: 'USER', label: 'Người dùng' },
            ]}
          />

          <Select
            placeholder="Lọc trạng thái"
            style={{ width: '160px', height: '40px' }}
            allowClear
            onChange={(val) => { setStatusFilter(val || null); setPage(1); }}
            options={[
              { value: 'ACTIVE', label: 'Đang hoạt động' },
              { value: 'BLOCKED', label: 'Tạm khóa' },
              { value: 'PENDING_VERIFICATION', label: 'Chờ xác thực' },
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
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {/* Table */}
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
        title={editingUser ? 'Chỉnh sửa thông tin người dùng' : 'Thêm người dùng mới'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        okText={editingUser ? 'Cập nhật' : 'Thêm mới'}
        cancelText="Hủy"
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
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
          >
            <Input placeholder="Ví dụ: Nguyễn Văn A" style={{ height: '40px' }} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Địa chỉ Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không đúng định dạng!' },
            ]}
          >
            <Input placeholder="Ví dụ: name@example.com" style={{ height: '40px' }} />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input placeholder="Ví dụ: 0987654321" style={{ height: '40px' }} />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="Vai trò hệ thống"
            rules={[{ required: true }]}
          >
            <Select
              style={{ height: '40px' }}
              options={[
                { value: 'ADMIN', label: 'Quản trị viên' },
                { value: 'MODERATOR', label: 'Biên tập viên' },
                { value: 'USER', label: 'Người dùng' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

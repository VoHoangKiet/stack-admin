import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Modal,
  Descriptions,
  Badge,
  Avatar,
  Tabs,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Select,
  Checkbox,
} from 'antd';
import { Building2, Eye, RefreshCw, Plus, Edit2, Trash2 } from 'lucide-react';
import apiClient from '../lib/api';
import { useAuth } from '../lib/auth';

// Type for workspace member (from /workspaces/:id/members)
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

// Type for workspace list item (from /workspaces/me or admin all workspaces)
interface WorkspaceItem {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  plan: string;
  createdAt: string;
  currentUserRole?: string;
}

interface WorkspaceRole {
  id: string;
  workspaceId: string;
  name: string;
  permissions?: Record<string, any>;
  createdAt: string;
}

const PERMISSION_GROUPS = [
  {
    title: 'Workspace Management',
    permissions: [
      { label: 'All Workspace Permissions', value: 'workspace:*' },
      { label: 'View Workspace', value: 'workspace:view' },
      { label: 'Edit Workspace', value: 'workspace:edit' },
      { label: 'Delete Workspace', value: 'workspace:delete' },
    ],
  },
  {
    title: 'Member Management',
    permissions: [
      { label: 'All Member Permissions', value: 'member:*' },
      { label: 'View Member', value: 'member:view' },
      { label: 'Invite Member', value: 'member:invite' },
      { label: 'Remove Member', value: 'member:remove' },
      { label: 'Edit Member Role', value: 'member:edit-role' },
    ],
  },
  {
    title: 'Channel Management',
    permissions: [
      { label: 'All Channel Permissions', value: 'channel:*' },
      { label: 'View Channel', value: 'channel:view' },
      { label: 'Create Channel', value: 'channel:create' },
      { label: 'Delete Channel', value: 'channel:delete' },
      { label: 'Join Channel', value: 'channel:join' },
    ],
  },
  {
    title: 'Message Management',
    permissions: [
      { label: 'All Message Permissions', value: 'message:*' },
      { label: 'View Message', value: 'message:view' },
      { label: 'Send Message', value: 'message:create' },
      { label: 'Delete Message', value: 'message:delete' },
    ],
  },
];

export const Workspaces: React.FC = () => {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState<WorkspaceItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  // States for members pagination and search
  const [memberPage, setMemberPage] = useState(1);
  const [memberPageSize, setMemberPageSize] = useState(10);
  const [memberTotal, setMemberTotal] = useState(0);
  const [memberSearch, setMemberSearch] = useState('');

  // States for roles management
  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<WorkspaceRole | null>(null);
  const [roleForm] = Form.useForm();

  const defaultRoles = ['owner', 'admin', 'member'];

  const isSystemAdmin = user?.role === 'ADMIN';

  const fetchWorkspaces = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/workspaces/me');
      const data = res.data.data || [];
      if (isSystemAdmin) {
        setWorkspaces(data);
      } else {
        const managed = data.filter((ws: any) => 
          ws.ownerId === user?.id || 
          ws.currentUserRole === 'owner' || 
          ws.currentUserRole === 'admin'
        );
        setWorkspaces(managed);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  }, [isSystemAdmin, user?.id]);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const fetchMembers = useCallback(async (workspaceId: string, pageNum = 1, pageSizeNum = 10, searchStr = '') => {
    setMembersLoading(true);
    try {
      const res = await apiClient.get(`/workspaces/${workspaceId}/members`, {
        params: { page: pageNum, take: pageSizeNum, search: searchStr }
      });
      setMembers(res.data.data || []);
      setMemberTotal(res.data.meta?.itemCount || 0);
    } catch {
      setMembers([]);
      setMemberTotal(0);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const fetchRoles = async (workspaceId: string) => {
    setRolesLoading(true);
    try {
      const res = await apiClient.get(`/admin/workspaces/${workspaceId}/roles`);
      setRoles(res.data.data);
    } catch {
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  };

  const openDetail = async (ws: WorkspaceItem) => {
    setSelectedWs(ws);
    setDetailOpen(true);
    setActiveTab('members');
    setMemberPage(1);
    setMemberPageSize(10);
    setMemberSearch('');
    fetchMembers(ws.id, 1, 10, '');
    fetchRoles(ws.id);
  };

  const handleOpenRoleModal = (role?: WorkspaceRole) => {
    if (role) {
      setEditingRole(role);
      const actionsObj = role.permissions?.actions || {};
      const activeActions = Object.keys(actionsObj).filter((k) => actionsObj[k] === true);

      roleForm.setFieldsValue({
        name: role.name,
        actionsList: activeActions,
        permissionsJson: JSON.stringify(role.permissions || {}, null, 2),
      });
    } else {
      setEditingRole(null);
      const defaultPerms = {
        actions: {
          'channel:view': true,
          'message:create': true,
          'message:view': true,
        },
        dataScopes: {
          workspace: ['basic'],
        },
      };
      roleForm.setFieldsValue({
        name: '',
        actionsList: ['channel:view', 'message:create', 'message:view'],
        permissionsJson: JSON.stringify(defaultPerms, null, 2),
      });
    }
    setRoleModalOpen(true);
  };

  const handleCheckboxChange = (checkedValues: string[]) => {
    const actionsObj: Record<string, boolean> = {};
    checkedValues.forEach((val) => {
      actionsObj[val] = true;
    });

    let currentJson: any = {};
    try {
      currentJson = JSON.parse(roleForm.getFieldValue('permissionsJson') || '{}');
    } catch {
      // ignore
    }

    const updatedPermissions = {
      ...currentJson,
      actions: actionsObj,
    };

    roleForm.setFieldsValue({
      permissionsJson: JSON.stringify(updatedPermissions, null, 2),
    });
  };

  const handleJsonChange = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const actionsObj = parsed.actions || {};
      const activeActions = Object.keys(actionsObj).filter((k) => actionsObj[k] === true);
      roleForm.setFieldsValue({
        actionsList: activeActions,
      });
    } catch {
      // ignore
    }
  };

  const handleRoleSubmit = async () => {
    if (!selectedWs) return;
    try {
      const values = await roleForm.validateFields();
      let parsedPermissions = {};
      try {
        parsedPermissions = JSON.parse(values.permissionsJson);
      } catch {
        message.error('Invalid permissions JSON format');
        return;
      }

      const payload = {
        name: values.name,
        permissions: parsedPermissions,
      };

      if (editingRole) {
        await apiClient.put(`/admin/workspace-roles/${editingRole.id}`, payload);
        message.success('Role updated successfully');
      } else {
        await apiClient.post(`/admin/workspaces/${selectedWs.id}/roles`, payload);
        message.success('Role created successfully');
      }

      setRoleModalOpen(false);
      fetchRoles(selectedWs.id);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'An error occurred';
      message.error(errMsg);
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!selectedWs) return;
    try {
      await apiClient.delete(`/admin/workspace-roles/${roleId}`);
      message.success('Role deleted successfully');
      fetchRoles(selectedWs.id);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to delete this role';
      message.error(errMsg);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, roleId: string) => {
    if (!selectedWs) return;
    try {
      await apiClient.put(`/admin/workspace-members/${memberId}/role`, { roleId });
      message.success('Member role updated successfully');
      fetchMembers(selectedWs.id, memberPage, memberPageSize, memberSearch);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to change role for this member';
      message.error(errMsg);
    }
  };

  const planColors: Record<string, string> = {
    free: 'default',
    pro: 'blue',
    enterprise: 'purple',
  };

  const renderPermissionCheckboxes = (selectedValues: string[], onChange: (values: string[]) => void) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PERMISSION_GROUPS.map((group) => (
          <div key={group.title} style={{ border: '1px solid #f0f0f0', borderRadius: 6, padding: 12 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-main)' }}>{group.title}</div>
            <Row gutter={[16, 8]}>
              {group.permissions.map((perm) => (
                <Col span={12} key={perm.value}>
                  <Checkbox
                    checked={selectedValues.includes(perm.value)}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      let newValues = [...selectedValues];
                      if (isChecked) {
                        newValues.push(perm.value);
                      } else {
                        newValues = newValues.filter((val) => val !== perm.value);
                      }
                      onChange(newValues);
                    }}
                  >
                    {perm.label} <code style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({perm.value})</code>
                  </Checkbox>
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </div>
    );
  };

  const columns = [
    {
      title: 'Workspace',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: WorkspaceItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar
            style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600 }}
          >
            <Building2 size={18} />
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{name}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/{record.slug}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Owner',
      dataIndex: 'ownerName',
      key: 'ownerName',
      render: (name: string, record: WorkspaceItem) => (
        <span style={{ color: 'var(--text-main)' }}>{name || record.ownerEmail || '—'}</span>
      ),
    },
    {
      title: 'Plan',
      dataIndex: 'plan',
      key: 'plan',
      render: (plan: string) => (
        <Tag color={planColors[plan] || 'default'}>{plan.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => (
        <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          {new Date(date).toLocaleDateString('en-US')}
        </span>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: WorkspaceItem) => (
        <Button
          type="link"
          icon={<Eye size={15} />}
          onClick={() => openDetail(record)}
        >
          Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Workspace Management
          </h2>
          <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
            View the list and details of workspaces on the system.
          </p>
        </div>
        <Button
          icon={<RefreshCw size={16} />}
          onClick={fetchWorkspaces}
          style={{ height: '40px', borderRadius: 'var(--radius-md)' }}
        />
      </div>

      {/* Summary cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8}>
          <Card bordered={false}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Building2 size={24} style={{ color: 'var(--primary)' }} />
              <div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)' }}>{workspaces.length}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Workspaces</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Workspace table */}
      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={workspaces}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={selectedWs?.name || 'Workspace Detail'}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        {selectedWs && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Name">{selectedWs.name}</Descriptions.Item>
              <Descriptions.Item label="Slug">/{selectedWs.slug}</Descriptions.Item>
              <Descriptions.Item label="Owner">{selectedWs.ownerName || '—'}</Descriptions.Item>
              <Descriptions.Item label="Plan">
                <Tag color={planColors[selectedWs.plan]}>{selectedWs.plan.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {new Date(selectedWs.createdAt).toLocaleDateString('en-US')}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: 'members',
                  label: `Members (${memberTotal})`,
                  children: (
                    <div>
                      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                        <Input.Search
                          placeholder="Search members by name or email..."
                          value={memberSearch}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          onSearch={(val) => {
                            setMemberPage(1);
                            if (selectedWs) {
                              fetchMembers(selectedWs.id, 1, memberPageSize, val);
                            }
                          }}
                          style={{ width: 280 }}
                          allowClear
                        />
                      </div>
                      <Table
                         dataSource={members}
                         rowKey="id"
                         loading={membersLoading}
                         size="small"
                         pagination={{
                           current: memberPage,
                           pageSize: memberPageSize,
                           total: memberTotal,
                           onChange: (p, ps) => {
                             setMemberPage(p);
                             setMemberPageSize(ps);
                             if (selectedWs) {
                               fetchMembers(selectedWs.id, p, ps, memberSearch);
                             }
                           },
                           showSizeChanger: true,
                           pageSizeOptions: ['5', '10', '20', '50'],
                         }}
                         columns={[
                         {
                           title: 'Member',
                           dataIndex: 'name',
                           render: (name: string, record: WorkspaceMember) => (
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <Avatar size="small" src={record.avatar || undefined} style={{ verticalAlign: 'middle' }}>
                                 {name?.charAt(0)?.toUpperCase()}
                               </Avatar>
                               <div>
                                 <span style={{ fontWeight: 500 }}>{name}</span>
                                 <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: 8 }}>{record.email}</span>
                               </div>
                             </div>
                           ),
                         },
                         {
                           title: 'Role',
                           dataIndex: 'roleName',
                           width: 150,
                           render: (roleName: string, record: WorkspaceMember) => {
                             const isOwner = roleName.toLowerCase() === 'owner';
                             if (isOwner) {
                               return <Tag color="orange">owner</Tag>;
                             }
                             return (
                               <Select
                                 value={record.roleId}
                                 style={{ width: 120 }}
                                 onChange={(value) => {
                                   const targetRole = roles.find((r) => r.id === value);
                                   Modal.confirm({
                                     title: 'Confirm Role Change',
                                     content: `Are you sure you want to change the role of member "${record.name}" to "${targetRole?.name || 'new'}"?`,
                                     okText: 'Confirm',
                                     cancelText: 'Cancel',
                                     onOk: () => {
                                       handleUpdateMemberRole(record.id, value);
                                     },
                                   });
                                 }}
                                 options={roles
                                   .filter((r) => r.name.toLowerCase() !== 'owner')
                                   .map((r) => ({ label: r.name, value: r.id }))}
                                 loading={rolesLoading}
                               />
                             );
                           },
                         },
                         {
                           title: 'Status',
                           dataIndex: 'status',
                           width: 120,
                           render: (status: string) => (
                             <Badge status={status === 'active' ? 'success' : 'default'} text={status} />
                           ),
                         },
                       ]}
                     />
                    </div>
                  ),
                },
                {
                  key: 'roles',
                  label: `Roles (${roles.length})`,
                  children: (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <Button
                          type="primary"
                          icon={<Plus size={14} />}
                          onClick={() => handleOpenRoleModal()}
                        >
                          Add Role
                        </Button>
                      </div>
                      <Table
                        dataSource={roles}
                        rowKey="id"
                        loading={rolesLoading}
                        pagination={false}
                        size="small"
                        columns={[
                          {
                            title: 'Role',
                            dataIndex: 'name',
                            key: 'name',
                            render: (name: string) => (
                              <span style={{ fontWeight: 600 }}>{name}</span>
                            ),
                          },
                          {
                            title: 'Permissions',
                            dataIndex: 'permissions',
                            key: 'permissions',
                            render: (permissions: any) => {
                              const actions = permissions?.actions ? Object.keys(permissions.actions) : [];
                              if (actions.length === 0) return <span style={{ color: 'var(--text-muted)' }}>No permissions</span>;
                              return (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                  {actions.map((act) => (
                                    <Tag key={act} style={{ fontSize: '10px', margin: 0 }}>
                                      {act}
                                    </Tag>
                                  ))}
                                </div>
                              );
                            },
                          },
                          {
                            title: 'Action',
                            key: 'action',
                            width: 120,
                            render: (_: any, record: WorkspaceRole) => {
                              const isDefault = defaultRoles.includes(record.name.toLowerCase());
                              return (
                                <Space>
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<Edit2 size={14} />}
                                    onClick={() => handleOpenRoleModal(record)}
                                  />
                                  {!isDefault && (
                                    <Popconfirm
                                      title="Are you sure you want to delete this role?"
                                      onConfirm={() => handleDeleteRole(record.id)}
                                      okText="Yes"
                                      cancelText="No"
                                    >
                                      <Button
                                        type="text"
                                        size="small"
                                        danger
                                        icon={<Trash2 size={14} />}
                                      />
                                    </Popconfirm>
                                  )}
                                </Space>
                              );
                            },
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}
      </Modal>

      {/* Add/Edit Role Modal */}
      <Modal
        title={editingRole ? 'Edit Role' : 'Add Role'}
        open={roleModalOpen}
        onOk={handleRoleSubmit}
        onCancel={() => setRoleModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width={600}
      >
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="name"
            label="Role Name"
            rules={[
              { required: true, message: 'Please enter role name' },
              { min: 2, message: 'Role name must be at least 2 characters' },
              { max: 50, message: 'Role name cannot exceed 50 characters' },
            ]}
          >
            <Input
              disabled={editingRole ? defaultRoles.includes(editingRole.name.toLowerCase()) : false}
              placeholder="E.g., Moderator, Guest"
            />
          </Form.Item>

          <Tabs
            defaultActiveKey="checkbox"
            items={[
              {
                key: 'checkbox',
                label: 'Permissions (Visual)',
                children: (
                  <div style={{ maxHeight: 350, overflowY: 'auto', paddingRight: 8, paddingTop: 8 }}>
                    <Form.Item name="actionsList" noStyle>
                      {({ getFieldValue }) => {
                        const list = getFieldValue('actionsList') || [];
                        return renderPermissionCheckboxes(list, (newValues) => {
                          roleForm.setFieldsValue({ actionsList: newValues });
                          handleCheckboxChange(newValues);
                        });
                      }}
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'json',
                label: 'Advanced (JSON)',
                children: (
                  <div style={{ paddingTop: 8 }}>
                    <Form.Item
                      name="permissionsJson"
                      rules={[
                        { required: true, message: 'Please configure permissions' },
                        {
                          validator: (_, value) => {
                            try {
                              JSON.parse(value);
                              return Promise.resolve();
                            } catch {
                              return Promise.reject(new Error('Invalid JSON format'));
                            }
                          },
                        },
                      ]}
                      extra='Enter permissions JSON structure. E.g., { "actions": { "channel:create": true } }'
                    >
                      <Input.TextArea
                        rows={12}
                        style={{ fontFamily: 'monospace', fontSize: '12px' }}
                        onChange={(e) => handleJsonChange(e.target.value)}
                      />
                    </Form.Item>
                  </div>
                ),
              },
            ]}
          />
        </Form>
      </Modal>
    </div>
  );
};

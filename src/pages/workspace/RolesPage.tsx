import React, { useState, useCallback, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Space,
  Popconfirm,
  message,
  Card,
  Checkbox,
  Tooltip,
} from 'antd';
import { ShieldCheck, Plus, Edit2, Trash2, RefreshCw, Lock } from 'lucide-react';
import { useParams } from 'react-router-dom';
import apiClient from '../../lib/api';
import { useWorkspace } from '../../lib/workspace-context';

interface WorkspaceRole {
  id: string;
  workspaceId: string;
  name: string;
  permissions?: Record<string, any>;
  createdAt: string;
}

const PERMISSION_OPTIONS = [
  { label: 'All Workspace Permissions', value: 'workspace:*' },
  { label: 'Manage Roles & Permissions', value: 'workspace:manage_roles', parent: 'workspace:*' },
  { label: 'Update Workspace Settings', value: 'workspace:update_settings', parent: 'workspace:*' },
  { label: 'All Member Permissions', value: 'member:*' },
  { label: 'Invite Members', value: 'member:invite', parent: 'member:*' },
  { label: 'Update Member Roles', value: 'member:update_role', parent: 'member:*' },
  { label: 'Remove Members', value: 'member:remove', parent: 'member:*' },
  { label: 'All Channel Permissions', value: 'channel:*' },
  { label: 'Create Channels', value: 'channel:create', parent: 'channel:*' },
];

const ALLOWED_ACTIONS = new Set(PERMISSION_OPTIONS.map((p) => p.value));

const LEGACY_MAP: Record<string, string> = {
  'workspace:edit': 'workspace:update_settings',
  'member:edit-role': 'member:update_role',
};

const collapseWildcards = (actions: string[]) => {
  const selected = new Set(actions);
  PERMISSION_OPTIONS.forEach((p) => {
    if (p.parent && selected.has(p.parent)) selected.delete(p.value);
  });
  return Array.from(selected);
};

const normalizePerms = (permissions?: Record<string, any>) => {
  const actions = permissions?.actions || {};
  const normalized: Record<string, boolean> = {};
  Object.keys(actions).forEach((action) => {
    if (actions[action] !== true) return;
    const mapped = LEGACY_MAP[action] || action;
    if (ALLOWED_ACTIONS.has(mapped)) normalized[mapped] = true;
  });
  const collapsed = collapseWildcards(Object.keys(normalized)).reduce<Record<string, boolean>>((acc, a) => {
    acc[a] = true;
    return acc;
  }, {});
  return {
    ...permissions,
    actions: collapsed,
    dataScopes: {
      ...(permissions?.dataScopes || {}),
      workspace: Array.isArray(permissions?.dataScopes?.workspace)
        ? permissions.dataScopes.workspace
        : ['basic'],
    },
  };
};

const DEFAULT_ROLES = ['owner', 'admin', 'member'];

const permissionGroupColors: Record<string, string> = {
  'workspace:*': '#8b5cf6',
  'workspace:manage_roles': '#a78bfa',
  'workspace:update_settings': '#a78bfa',
  'member:*': '#3b82f6',
  'member:invite': '#60a5fa',
  'member:update_role': '#60a5fa',
  'member:remove': '#60a5fa',
  'channel:*': '#10b981',
  'channel:create': '#34d399',
};

export const RolesPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { capabilities, activeWorkspace } = useWorkspace();

  const [roles, setRoles] = useState<WorkspaceRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<WorkspaceRole | null>(null);
  const [form] = Form.useForm();

  const canManage = capabilities.canManageWorkspaceRoles === true;

  const fetchRoles = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/workspaces/${workspaceId}/roles`);
      setRoles(res.data.data || []);
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const openModal = (role?: WorkspaceRole) => {
    if (!canManage) {
      message.error('You do not have permission to manage roles');
      return;
    }
    if (role) {
      setEditingRole(role);
      const editorPerms = normalizePerms(role.permissions || {});
      const actionsObj = editorPerms.actions || {};
      const activeActions = Object.keys(actionsObj).filter((k) => actionsObj[k] === true);
      form.setFieldsValue({
        name: role.name,
        actionsList: activeActions,
        permissionsJson: JSON.stringify(editorPerms, null, 2),
      });
    } else {
      setEditingRole(null);
      const defPerms = normalizePerms({ actions: {}, dataScopes: { workspace: ['basic'] } });
      form.setFieldsValue({
        name: '',
        actionsList: [],
        permissionsJson: JSON.stringify(defPerms, null, 2),
      });
    }
    setModalOpen(true);
  };

  const handleCheckboxChange = (checked: string[]) => {
    const actionsObj: Record<string, boolean> = {};
    collapseWildcards(checked).forEach((v) => (actionsObj[v] = true));
    let currentJson: any = {};
    try {
      currentJson = JSON.parse(form.getFieldValue('permissionsJson') || '{}');
    } catch {}
    form.setFieldsValue({
      actionsList: Object.keys(actionsObj),
      permissionsJson: JSON.stringify({ ...currentJson, actions: actionsObj }, null, 2),
    });
  };

  const handleJsonChange = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const actionsObj = normalizePerms(parsed).actions || {};
      form.setFieldsValue({
        actionsList: Object.keys(actionsObj).filter((k) => actionsObj[k]),
      });
    } catch {}
  };

  const handleSubmit = async () => {
    if (!workspaceId || !canManage) return;
    try {
      const values = await form.validateFields();
      let parsedPerms = {};
      try {
        parsedPerms = JSON.parse(values.permissionsJson);
      } catch {
        message.error('Invalid JSON in permissions');
        return;
      }
      const payload = { name: values.name, permissions: parsedPerms };
      if (editingRole) {
        await apiClient.put(`/admin/workspace-roles/${editingRole.id}`, payload);
        message.success('Role updated');
      } else {
        await apiClient.post(`/admin/workspaces/${workspaceId}/roles`, payload);
        message.success('Role created');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'An error occurred');
    }
  };

  const handleDelete = async (roleId: string) => {
    if (!canManage) return;
    try {
      await apiClient.delete(`/admin/workspace-roles/${roleId}`);
      message.success('Role deleted');
      fetchRoles();
    } catch (err: any) {
      message.error(err.response?.data?.message || 'Failed to delete role');
    }
  };

  const columns = [
    {
      title: 'Role',
      dataIndex: 'name',
      render: (name: string) => {
        const isDefault = DEFAULT_ROLES.includes(name.toLowerCase());
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>{name}</span>
            {isDefault && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: '#64748b',
                  background: 'rgba(100,116,139,0.1)',
                  padding: '1px 8px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                }}
              >
                default
              </span>
            )}
          </div>
        );
      },
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      render: (permissions: any) => {
        const actions = permissions?.actions ? Object.keys(permissions.actions) : [];
        if (actions.length === 0) {
          return <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>No permissions</span>;
        }
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {actions.map((act) => (
              <Tag
                key={act}
                style={{
                  fontSize: 11,
                  margin: 0,
                  borderRadius: 20,
                  color: permissionGroupColors[act] || '#64748b',
                  background: `${permissionGroupColors[act] || '#64748b'}18`,
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                {act}
              </Tag>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Actions',
      key: 'action',
      width: 100,
      render: (_: any, record: WorkspaceRole) => {
        const isDefault = DEFAULT_ROLES.includes(record.name.toLowerCase());
        return (
          <Space>
            <Tooltip title={canManage ? 'Edit role' : 'No permission'}>
              <Button
                type="text"
                size="small"
                icon={<Edit2 size={14} />}
                disabled={!canManage}
                onClick={() => openModal(record)}
              />
            </Tooltip>
            {!isDefault && (
              <Popconfirm
                title={`Delete role "${record.name}"?`}
                onConfirm={() => handleDelete(record.id)}
                okText="Delete"
                cancelText="Cancel"
                disabled={!canManage}
                okButtonProps={{ danger: true }}
              >
                <Tooltip title={canManage ? 'Delete role' : 'No permission'}>
                  <Button
                    type="text"
                    size="small"
                    danger
                    disabled={!canManage}
                    icon={<Trash2 size={14} />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>Roles</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
            {activeWorkspace?.name} · {roles.length} role{roles.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<RefreshCw size={15} />} onClick={fetchRoles} style={{ height: 38, borderRadius: 9 }} />
          <Tooltip title={!canManage ? 'You need workspace:manage_roles permission' : ''}>
            <Button
              type="primary"
              icon={<Plus size={15} />}
              disabled={!canManage}
              onClick={() => openModal()}
              style={{
                height: 38,
                borderRadius: 9,
                background: canManage ? 'linear-gradient(135deg, #fa8c16, #f97316)' : undefined,
                border: 'none',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              Add Role
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Permission legend */}
      <Card
        bordered={false}
        size="small"
        style={{ borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-app)' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <Lock size={13} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 4 }}>Permission groups:</span>
          {[
            { label: 'workspace:*', color: '#8b5cf6' },
            { label: 'member:*', color: '#3b82f6' },
            { label: 'channel:*', color: '#10b981' },
          ].map((g) => (
            <Tag
              key={g.label}
              style={{
                fontSize: 11,
                borderRadius: 20,
                color: g.color,
                background: `${g.color}18`,
                border: 'none',
                fontWeight: 600,
                margin: 0,
              }}
            >
              {g.label}
            </Tag>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card bordered={false} style={{ borderRadius: 16, border: '1px solid var(--border-color)' }} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          loading={loading}
          pagination={false}
          style={{ padding: '0 4px' }}
        />
      </Card>

      {/* Add/Edit Role Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={18} style={{ color: 'var(--primary)' }} />
            {editingRole ? 'Edit Role' : 'New Role'}
          </div>
        }
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText="Save"
        cancelText="Cancel"
        width={640}
        okButtonProps={{ disabled: !canManage }}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Role name" rules={[{ required: true, message: 'Role name is required' }]}>
            <Input placeholder="e.g. moderator" />
          </Form.Item>

          <Form.Item label="Permissions" name="actionsList">
            <Form.Item noStyle shouldUpdate={(prev, cur) => prev.actionsList !== cur.actionsList}>
              {({ getFieldValue, setFieldsValue }) => {
                const actionsList: string[] = getFieldValue('actionsList') || [];
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PERMISSION_OPTIONS.map((perm) => {
                      const isDisabled = Boolean(perm.parent && actionsList.includes(perm.parent));
                      const isChecked = actionsList.includes(perm.value) || isDisabled;
                      return (
                        <div
                          key={perm.value}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            paddingLeft: perm.parent ? 20 : 0,
                          }}
                        >
                          <Checkbox
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={(e) => {
                              let next = [...actionsList];
                              if (e.target.checked) {
                                next.push(perm.value);
                              } else {
                                next = next.filter((v) => v !== perm.value);
                              }
                              handleCheckboxChange(Array.from(new Set(next)));
                            }}
                          />
                          <span style={{ fontSize: 13, color: 'var(--text-main)' }}>{perm.label}</span>
                          <code
                            style={{
                              fontSize: 11,
                              color: permissionGroupColors[perm.value] || 'var(--text-muted)',
                              background: `${permissionGroupColors[perm.value] || '#64748b'}14`,
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {perm.value}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                );
              }}
            </Form.Item>
          </Form.Item>

          <Form.Item
            label={
              <span>
                Raw JSON Permissions{' '}
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 400 }}>
                  (advanced – auto-syncs with checkboxes)
                </span>
              </span>
            }
            name="permissionsJson"
          >
            <Input.TextArea
              rows={6}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
              onChange={(e) => handleJsonChange(e.target.value)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

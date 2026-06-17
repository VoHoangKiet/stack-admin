import React, { useState } from 'react';
import { Card, Button, Input, Form, message, Divider, Tag, Popconfirm } from 'antd';
import { Settings, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../lib/api';
import { useWorkspace } from '../../lib/workspace-context';

export const WorkspaceSettingsPage: React.FC = () => {
  const { id: workspaceId } = useParams<{ id: string }>();
  const { activeWorkspace, capabilities, refreshWorkspaces } = useWorkspace();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const canUpdate = capabilities.canUpdateWorkspaceSettings === true;

  const handleSave = async () => {
    if (!canUpdate) {
      message.error('You do not have permission to update workspace settings');
      return;
    }
    try {
      setSaving(true);
      const values = await form.validateFields();
      await apiClient.put(`/workspaces/${workspaceId}`, values);
      message.success('Workspace settings saved');
      refreshWorkspaces();
    } catch (err: any) {
      if (err?.errorFields) return; // validation error, not API
      message.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const planColors: Record<string, string> = {
    free: '#8c8c8c',
    pro: '#2563eb',
    enterprise: '#7c3aed',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          Settings
        </h2>
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
          {activeWorkspace?.name} · Workspace configuration
        </p>
      </div>

      {/* General info */}
      <Card
        bordered={false}
        style={{ border: '1px solid var(--border-color)', borderRadius: 12 }}
        title={
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            General
          </span>
        }
      >
        {activeWorkspace && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Read-only info rows */}
            {[
              { label: 'Workspace ID', value: activeWorkspace.id, mono: true },
              { label: 'Slug', value: `/${activeWorkspace.slug}`, mono: true },
              {
                label: 'Plan',
                value: (
                  <span style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: planColors[activeWorkspace.plan] || '#8c8c8c',
                    background: `${planColors[activeWorkspace.plan] || '#8c8c8c'}12`,
                    border: `1px solid ${planColors[activeWorkspace.plan] || '#8c8c8c'}25`,
                    padding: '2px 10px',
                    borderRadius: 6,
                  }}>
                    {activeWorkspace.plan.charAt(0).toUpperCase() + activeWorkspace.plan.slice(1)}
                  </span>
                ),
              },
              {
                label: 'Created',
                value: new Date(activeWorkspace.createdAt).toLocaleDateString('vi-VN', {
                  year: 'numeric', month: 'long', day: 'numeric'
                }),
              },
              { label: 'Owner', value: activeWorkspace.ownerName || activeWorkspace.ownerEmail || '—' },
            ].map(({ label, value, mono }) => (
              <div key={label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '8px 0',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <span style={{
                  width: 120,
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}>
                  {label}
                </span>
                <span style={{
                  fontSize: 13,
                  color: 'var(--text-main)',
                  fontFamily: mono ? 'monospace' : undefined,
                  fontWeight: mono ? 400 : 500,
                }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Editable settings */}
      <Card
        bordered={false}
        style={{ border: '1px solid var(--border-color)', borderRadius: 12 }}
        title={
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-main)' }}>
            Edit Workspace
          </span>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ name: activeWorkspace?.name }}
          disabled={!canUpdate}
        >
          <Form.Item
            name="name"
            label={<span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)' }}>Workspace name</span>}
            rules={[{ required: true, message: 'Name is required' }, { min: 2, message: 'At least 2 characters' }]}
          >
            <Input
              placeholder="Enter workspace name"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Button
            type="primary"
            icon={<Save size={14} />}
            onClick={handleSave}
            loading={saving}
            disabled={!canUpdate}
            style={{
              borderRadius: 8,
              height: 36,
              fontWeight: 500,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Save changes
          </Button>

          {!canUpdate && (
            <p style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
              You need <code>workspace:update_settings</code> permission to edit.
            </p>
          )}
        </Form>
      </Card>

      {/* Danger zone */}
      <Card
        bordered={false}
        style={{ border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12 }}
        title={
          <span style={{ fontSize: 14, fontWeight: 600, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={15} /> Danger Zone
          </span>
        }
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-main)', marginBottom: 3 }}>
              Leave workspace
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              You will lose access to all content in this workspace.
            </div>
          </div>
          <Popconfirm
            title="Leave this workspace?"
            description="You will need to be re-invited to regain access."
            okText="Leave"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => message.info('Feature coming soon')}
          >
            <Button
              danger
              size="small"
              style={{ borderRadius: 7, height: 32, fontSize: 13 }}
            >
              Leave
            </Button>
          </Popconfirm>
        </div>
      </Card>
    </div>
  );
};

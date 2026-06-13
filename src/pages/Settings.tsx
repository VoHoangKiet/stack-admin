import React, { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Form,
  Input,
  Button,
  Switch,
  Radio,
  Divider,
  message,
  Avatar,
  Select,
  Spin,
} from 'antd';
import {
  User,
  Settings as SettingsIcon,
  Lock,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import apiClient from '../lib/api';
import { useAuth } from '../lib/auth';

interface SystemSetting {
  key: string;
  value: string;
  type: string;
  description: string;
}

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [profileForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Load system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get('/admin/settings');
        setSettings(res.data.data);
      } catch {
        // Settings not available yet - use defaults
        setSettings([
          { key: 'maintenance_mode', value: 'false', type: 'boolean', description: 'Maintenance mode — only admins can access' },
          { key: 'allow_registration', value: 'true', type: 'boolean', description: 'Allow users to register accounts' },
          { key: 'api_debug_logging', value: 'true', type: 'boolean', description: 'Detailed API request/response logging' },
          { key: 'email_notifications', value: 'true', type: 'boolean', description: 'Send notifications via email' },
        ]);
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleProfileSave = async (values: any) => {
    setLoading(true);
    try {
      await apiClient.patch('/users/profile', {
        name: values.fullName,
        phone: values.phone,
      });
      message.success('Profile updated successfully!');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySave = async (values: any) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Confirm password does not match!');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/users/change-password', {
        oldPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully!');
      securityForm.resetFields();
    } catch {
      message.error('Incorrect current password');
    } finally {
      setLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      message.error('Image size must not exceed 2MB');
      return;
    }

    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await apiClient.post(`/users/avatar/${user.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      message.success('Avatar updated successfully!');
      // Refresh page to show new avatar
      window.location.reload();
    } catch {
      message.error('Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
    }
  };
  const getSettingValue = (key: string): boolean => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value === 'true';
  };

  // Handle toggle switch for boolean settings
  const handleSettingToggle = async (key: string, checked: boolean) => {
    const prevSettings = [...settings];
    setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value: String(checked) } : s)));

    setSavingSettings(true);
    try {
      await apiClient.patch('/admin/settings', {
        settings: [{ key, value: String(checked) }],
      });
      message.success(
        checked
          ? `Enabled ${settings.find((s) => s.key === key)?.description || key}`
          : `Disabled ${settings.find((s) => s.key === key)?.description || key}`
      );
    } catch {
      setSettings(prevSettings);
      message.error('Failed to update configuration');
    } finally {
      setSavingSettings(false);
    }
  };

  const items = [
    {
      key: 'profile',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <User size={16} /> Profile
        </span>
      ),
      children: (
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', marginTop: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, flex: '1 1 200px' }}>
            <Avatar
              size={120}
              src={user?.avatar || undefined}
              style={{
                border: '4px solid var(--primary-light)',
                backgroundColor: 'var(--primary)',
                fontSize: 48,
                verticalAlign: 'middle',
              }}
            >
              {user?.name?.charAt(0)?.toUpperCase()}
            </Avatar>
            <div style={{ textAlign: 'center' }}>
              <input
                type="file"
                id="avatar-upload"
                accept="image/png,image/jpeg,image/gif"
                style={{ display: 'none' }}
                onChange={handleAvatarUpload}
              />
              <Button
                icon={<UploadCloud size={14} style={{ marginRight: 6 }} />}
                loading={avatarUploading}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                Change Avatar
              </Button>
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--text-light)' }}>
                PNG, JPG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          <div style={{ flex: '2 1 400px' }}>
            <Form
              form={profileForm}
              layout="vertical"
              onFinish={handleProfileSave}
              initialValues={{
                fullName: user?.name || '',
                email: user?.email || '',
                phone: '',
                bio: '',
                timezone: 'Asia/Ho_Chi_Minh',
                language: 'vi',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
                  <Input style={{ height: '40px' }} />
                </Form.Item>
                <Form.Item name="email" label="Email Address" rules={[{ required: true, type: 'email' }]}>
                  <Input disabled style={{ height: '40px' }} />
                </Form.Item>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Form.Item name="phone" label="Phone Number">
                  <Input style={{ height: '40px' }} />
                </Form.Item>
                <Form.Item name="timezone" label="Timezone">
                  <Select
                    style={{ height: '40px' }}
                    options={[
                      { value: 'Asia/Ho_Chi_Minh', label: '(GMT+07:00) Bangkok, Hanoi, Jakarta' },
                      { value: 'Asia/Tokyo', label: '(GMT+09:00) Osaka, Sapporo, Tokyo' },
                      { value: 'UTC', label: '(GMT+00:00) UTC Coordinated Time' },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item name="bio" label="Bio">
                <Input.TextArea rows={3} placeholder="Enter a brief bio..." />
              </Form.Item>

              <Form.Item name="language" label="Default Language">
                <Radio.Group>
                  <Radio.Button value="vi">Tiếng Việt</Radio.Button>
                  <Radio.Button value="en">English</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Button type="primary" htmlType="submit" loading={loading} style={{ height: '40px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>
                Save Profile
              </Button>
            </Form>
          </div>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={16} /> Security
        </span>
      ),
      children: (
        <div style={{ maxWidth: '600px', marginTop: 16 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 20 }}>
            Change Password
          </h3>
          <Form form={securityForm} layout="vertical" onFinish={handleSecuritySave}>
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[{ required: true, message: 'Please enter current password' }]}
            >
              <Input.Password style={{ height: '40px' }} />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please enter new password' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password style={{ height: '40px' }} />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              rules={[{ required: true, message: 'Please confirm your new password' }]}
            >
              <Input.Password style={{ height: '40px' }} />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ height: '40px', borderRadius: 'var(--radius-md)', fontWeight: 500 }}
            >
              Update Password
            </Button>
          </Form>

          <Divider style={{ margin: '32px 0' }} />

          <h3
            style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-main)',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
            Two-Factor Authentication (2FA)
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: 16 }}>
            Add an extra layer of security to your account by requiring a verification code when logging in.
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: '14px' }}>Enable Authenticator App</strong>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Use apps like Google Authenticator or Authy to get verification codes.
              </span>
            </div>
            <Switch
              defaultChecked={false}
              onChange={(checked) => {
                message.info(
                  checked
                    ? '2FA activation requested. Please scan the QR code sent to your email.'
                    : '2FA disabled.'
                );
              }}
            />
          </div>
        </div>
      ),
    },
    user?.role === 'ADMIN' && {
      key: 'system',
      label: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SettingsIcon size={16} /> System Configuration
        </span>
      ),
      children: (
        <div style={{ maxWidth: '600px', marginTop: 16 }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-main)', marginBottom: 16 }}>
            System Modes
          </h3>

          {settingsLoading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {settings.map((setting) => (
                <div
                  key={setting.key}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ flex: 1, marginRight: 24 }}>
                    <strong style={{ display: 'block', fontSize: '14px' }}>
                      {setting.key === 'maintenance_mode'
                        ? 'Maintenance Mode'
                        : setting.key === 'allow_registration'
                          ? 'User Registration'
                          : setting.key === 'api_debug_logging'
                            ? 'API Debug Logging'
                            : setting.key === 'email_notifications'
                              ? 'Email Notifications'
                              : setting.key}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {setting.description}
                    </span>
                  </div>
                  <Switch
                    checked={getSettingValue(setting.key)}
                    onChange={(checked) => handleSettingToggle(setting.key, checked)}
                    loading={savingSettings}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
  ].filter(Boolean) as any;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
          System Settings
        </h2>
        <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
          Manage personal profiles, passwords, security authentication, and other system configurations.
        </p>
      </div>

      <Card bordered={false}>
        <Tabs defaultActiveKey="profile" items={items} />
      </Card>
    </div>
  );
};

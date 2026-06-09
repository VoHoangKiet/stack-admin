import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { ShieldCheck, Mail, Lock } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      if (err.response?.status === 401) {
        message.error('Email hoặc mật khẩu không đúng');
      } else if (err.message === 'Tài khoản không có quyền truy cập admin') {
        message.error('Tài khoản không có quyền truy cập admin');
      } else {
        message.error('Đăng nhập thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #0b0f19 0%, #151c2c 50%, #1a1f35 100%)',
        padding: 24,
      }}
    >
      <Card
        style={{
          width: 420,
          maxWidth: '100%',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        }}
        styles={{ body: { padding: '40px 32px' } }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #fa8c16, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShieldCheck size={28} color="#fff" />
          </div>
          <Title level={3} style={{ margin: 0, fontWeight: 700 }}>
            Stack Admin
          </Title>
          <Text type="secondary">Đăng nhập để quản trị hệ thống</Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          initialValues={{ email: '', password: '' }}
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<Mail size={16} style={{ color: 'var(--text-light)' }} />}
              placeholder="admin@stack.vn"
              size="large"
              style={{ height: 44, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          >
            <Input.Password
              prefix={<Lock size={16} style={{ color: 'var(--text-light)' }} />}
              placeholder="••••••••"
              size="large"
              style={{ height: 44, borderRadius: 10 }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{
                height: 44,
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

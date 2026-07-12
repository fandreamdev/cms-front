import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Spin, Typography } from 'antd'
import { Navigate, useNavigate, useSearch } from '@tanstack/react-router'
import { useAuth } from '../../contexts/authContextValue'
import type { LoginPayload } from '../../api/auth'

const LoginPage = () => {
  const { user, initialized, login } = useAuth()
  const [form] = Form.useForm<LoginPayload>()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }

  if (!initialized) return <Spin fullscreen description="正在验证登录状态…" />
  if (initialized && user) return <Navigate to="/admin" replace />

  const handleSubmit = async (values: LoginPayload) => {
    await login(values)
    const redirect = search.redirect
    navigate({ to: (redirect?.startsWith('/admin') ? redirect : '/admin') as never, replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'linear-gradient(135deg, #001529, #1677ff)',
      }}
    >
      <Card style={{ width: 400, maxWidth: 'calc(100vw - 32px)' }}>
        <Typography.Title level={2} style={{ textAlign: 'center' }}>
          CMS 管理后台
        </Typography.Title>
        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input prefix={<UserOutlined />} placeholder="用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage

import { LockOutlined, ReloadOutlined, UserOutlined } from '@ant-design/icons'
import { Button, Card, Form, Input, Spin, Typography } from 'antd'
import { Navigate, useNavigate, useSearch } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { getLoginCaptcha, type LoginCaptcha, type LoginPayload } from '../../api/auth'
import { useAuth } from '../../contexts/authContextValue'

type LoginFormValues = Omit<LoginPayload, 'captchaId'>

const LoginPage = () => {
  const { user, initialized, login } = useAuth()
  const [form] = Form.useForm<LoginFormValues>()
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { redirect?: string }
  const [captcha, setCaptcha] = useState<LoginCaptcha | null>(null)
  const [captchaLoading, setCaptchaLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true)
    try {
      setCaptcha(await getLoginCaptcha())
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCaptcha()
  }, [loadCaptcha])

  if (!initialized) return <Spin fullscreen description="正在验证登录状态…" />
  if (initialized && user) return <Navigate to="/admin" replace />

  const handleSubmit = async (values: LoginFormValues) => {
    if (!captcha) return

    setSubmitting(true)
    try {
      await login({ ...values, captchaId: captcha.captchaId })
      const redirect = search.redirect
      navigate({ to: (redirect?.startsWith('/admin') ? redirect : '/admin') as never, replace: true })
    } catch {
      form.resetFields(['captcha'])
      void loadCaptcha()
    } finally {
      setSubmitting(false)
    }
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
          <Form.Item
            name="captcha"
            rules={[
              { required: true, message: '请输入验证码' },
              { pattern: /^\d{4}$/, message: '验证码为 4 位数字' },
            ]}
          >
            <Input
              placeholder="4 位验证码"
              inputMode="numeric"
              maxLength={4}
              autoComplete="off"
              suffix={
                <Button
                  type="text"
                  size="small"
                  aria-label="刷新验证码"
                  icon={<ReloadOutlined spin={captchaLoading} />}
                  loading={captchaLoading}
                  onClick={() => void loadCaptcha()}
                />
              }
              addonAfter={
                captcha ? (
                  <img
                    src={captcha.image}
                    alt="验证码，点击刷新按钮更换"
                    style={{ display: 'block', width: 96, height: 32, objectFit: 'contain' }}
                  />
                ) : (
                  <Spin size="small" />
                )
              }
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={submitting} disabled={!captcha}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}

export default LoginPage

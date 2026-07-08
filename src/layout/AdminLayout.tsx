import { Layout, theme } from 'antd'
import { Outlet } from 'react-router'
import AppHeader from '../components/AppHeader/AppHeader'
import AppSider from '../components/AppSider/AppSider'
import { useState } from 'react'
import AppLogo from '../components/AppHeader/AppLogo'
const { Header, Content } = Layout

const AdminLayout = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()
  const [collapsed, setCollapsed] = useState(false)

  const toggleCollapsed = () => {
    setCollapsed(!collapsed)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          padding: 0,
          background: colorBgContainer,
          display: 'flex',
        }}
      >
        <AppLogo collapsed={collapsed} />
        <AppHeader toggleCollapsed={toggleCollapsed} collapsed={collapsed} />
      </Header>

      <Layout>
        <AppSider collapsed={collapsed} />
        <Content
          style={{
            margin: 24,
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout

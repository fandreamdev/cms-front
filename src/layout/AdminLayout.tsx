import { Layout, theme } from 'antd'
import { Outlet } from 'react-router'
import AppHeader from '../components/AppHeader/AppHeader'
import AppSider from '../components/AppSider/AppSider'
import { useState } from 'react'
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
    <Layout style={{ height: '100vh' }}>
      <AppSider collapsed={collapsed} />
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
          }}
        >
          <AppHeader toggleCollapsed={toggleCollapsed} collapsed={collapsed} />
        </Header>
        <Content
          style={{
            margin: 12,
            borderRadius: borderRadiusLG,
            overflow: 'auto',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}

export default AdminLayout

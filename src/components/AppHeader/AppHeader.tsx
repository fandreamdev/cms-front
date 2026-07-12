import { Avatar, Dropdown, Space, type MenuProps, Button } from 'antd'
import {
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../contexts/authContextValue'

interface AppHeaderProps {
  toggleCollapsed: () => void
  collapsed: boolean
}

const AppHeader = ({ toggleCollapsed, collapsed }: AppHeaderProps) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate({ to: '/login' })
  }

  const items: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Button type="text" onClick={toggleCollapsed}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>

      <Dropdown menu={{ items }} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>欢迎，{user?.username ?? '-'}</span>
          <DownOutlined style={{ fontSize: 12 }} />
        </Space>
      </Dropdown>
    </div>
  )
}

export default AppHeader

import { Avatar, Dropdown, Space, type MenuProps, Button } from 'antd'
import {
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router'

interface AppHeaderProps {
  toggleCollapsed: () => void
  collapsed: boolean
}

const AppHeader = ({ toggleCollapsed, collapsed }: AppHeaderProps) => {
  const navigate = useNavigate()

  const handleLogout = () => {
    // 清除登录态（token / 用户信息）
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    navigate('/login')
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
      <Button type='text' onClick={toggleCollapsed}>
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </Button>

      <Dropdown menu={{ items }} placement='bottomRight'>
        <Space style={{ cursor: 'pointer' }}>
          <Avatar size='small' icon={<UserOutlined />} />
          <span>欢迎，管理员</span>
          <DownOutlined style={{ fontSize: 12 }} />
        </Space>
      </Dropdown>
    </div>
  )
}

export default AppHeader

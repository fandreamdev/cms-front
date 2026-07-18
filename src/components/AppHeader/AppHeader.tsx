import { Avatar, Dropdown, Space, type MenuProps, Button, Tooltip } from 'antd'
import {
  DownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SunOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../contexts/authContextValue'
import { useThemeMode } from '../../contexts/themeContextValue'

interface AppHeaderProps {
  toggleCollapsed: () => void
  collapsed: boolean
}

const AppHeader = ({ toggleCollapsed, collapsed }: AppHeaderProps) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, transitioning, toggleTheme } = useThemeMode()

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

      <Space size="middle">
        <Tooltip title={isDark ? '切换到白天模式' : '切换到黑夜模式'}>
          <Button
            aria-label={isDark ? '切换到白天模式' : '切换到黑夜模式'}
            type="text"
            shape="circle"
            disabled={transitioning}
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect()
              toggleTheme({
                x: bounds.left + bounds.width / 2,
                y: bounds.top + bounds.height / 2,
              })
            }}
          />
        </Tooltip>
        <Dropdown menu={{ items }} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar size="small" icon={<UserOutlined />} />
            <span>欢迎，{user?.username ?? '-'}</span>
            <DownOutlined style={{ fontSize: 12 }} />
          </Space>
        </Dropdown>
      </Space>
    </div>
  )
}

export default AppHeader

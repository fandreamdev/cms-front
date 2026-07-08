import { Layout, Menu } from 'antd'
import { menuItems } from '../../config/menu'
import { useLocation, useNavigate } from 'react-router'

interface AppSiderProps {
  collapsed: boolean
}

const AppSider = ({ collapsed }: AppSiderProps) => {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  // 展开所有以当前路径为前缀的父级菜单
  const openKeys = ['/admin/system']
  return (
    <Layout.Sider theme='dark' width={220} collapsed={collapsed}>
      <Menu
        mode='inline'
        theme='dark'
        items={menuItems}
        selectedKeys={[pathname]}
        defaultOpenKeys={openKeys}
        onClick={({ key }) => navigate(key)}
      />
    </Layout.Sider>
  )
}

export default AppSider

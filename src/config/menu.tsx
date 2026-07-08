import type { MenuProps } from 'antd'
import { HomeOutlined, SettingOutlined } from '@ant-design/icons'

export type MenuItem = Required<MenuProps>['items'][number]

// key 直接用路由路径，点击时 navigate(key) 即可，选中态用 pathname 匹配
export const menuItems: MenuItem[] = [
  {
    key: '/admin',
    icon: <HomeOutlined />,
    label: '首页',
  },
  {
    key: '/admin/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      {
        key: '/admin/system/users',
        label: '用户列表',
      },
      {
        key: '/admin/system/roles',
        label: '角色列表',
      },
      {
        key: '/admin/system/accesses',
        label: '资源列表',
      },
    ],
  },
]

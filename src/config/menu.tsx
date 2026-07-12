import type { ReactNode } from 'react'
import {
  AuditOutlined,
  FileTextOutlined,
  FolderOutlined,
  HomeOutlined,
  SettingOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { MENU_PERMISSIONS } from './permissions'

export interface MenuItem {
  key: string
  label: ReactNode
  icon?: ReactNode
  permission?: string
  children?: MenuItem[]
}

// key 直接用路由路径，点击时 navigate(key) 即可，选中态用 pathname 匹配
export const menuItems: MenuItem[] = [
  {
    key: '/admin',
    icon: <HomeOutlined />,
    label: '首页',
  },

  {
    key: '/admin/reviews',
    icon: <AuditOutlined />,
    label: '审批管理',
    children: [
      {
        key: '/admin/reviews/articles',
        label: '文章审批',
        icon: <AuditOutlined />,
        permission: MENU_PERMISSIONS.reviews,
      },
    ],
  },
  {
    key: '/admin/system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      {
        key: '/admin/system/users',
        label: '用户列表',
        permission: MENU_PERMISSIONS.users,
      },
      {
        key: '/admin/system/roles',
        label: '角色列表',
        permission: MENU_PERMISSIONS.roles,
      },
      {
        key: '/admin/system/accesses',
        label: '资源列表',
        permission: MENU_PERMISSIONS.accesses,
      },
    ],
  },
  {
    key: '/admin/content',
    icon: <FileTextOutlined />,
    label: '内容管理',
    children: [
      {
        key: '/admin/content/articles',
        label: '文章管理',
        icon: <FileTextOutlined />,
        permission: MENU_PERMISSIONS.articles,
      },
      {
        key: '/admin/content/categories',
        label: '分类管理',
        icon: <FolderOutlined />,
        permission: MENU_PERMISSIONS.categories,
      },
      {
        key: '/admin/content/tags',
        label: '标签管理',
        icon: <TagsOutlined />,
        permission: MENU_PERMISSIONS.tags,
      },
    ],
  },
]

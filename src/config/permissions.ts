export const MENU_PERMISSIONS = {
  reviews: 'article:review:list',
  users: 'user:list',
  roles: 'role:list',
  accesses: 'access:list',
  settings: 'setting:list',
  articles: 'article:list',
  categories: 'category:list',
  tags: 'tag:list',
} as const

const ROUTE_PERMISSIONS = {
  '/admin/reviews/articles': MENU_PERMISSIONS.reviews,
  '/admin/system/users': MENU_PERMISSIONS.users,
  '/admin/system/roles': MENU_PERMISSIONS.roles,
  '/admin/system/accesses': MENU_PERMISSIONS.accesses,
  '/admin/system/settings': MENU_PERMISSIONS.settings,
  '/admin/content/articles': MENU_PERMISSIONS.articles,
  '/admin/content/categories': MENU_PERMISSIONS.categories,
  '/admin/content/tags': MENU_PERMISSIONS.tags,
} as const

export const BUTTON_PERMISSIONS = {
  user: {
    list: 'user:list',
    create: 'user:create',
    view: 'user:view',
    edit: 'user:edit',
    delete: 'user:delete',
  },
  role: {
    list: 'role:list',
    create: 'role:create',
    view: 'role:view',
    edit: 'role:edit',
    delete: 'role:delete',
  },
  access: {
    list: 'access:list',
    create: 'access:create',
    view: 'access:view',
    edit: 'access:edit',
    delete: 'access:delete',
  },
  setting: {
    list: 'setting:list',
    view: 'setting:view',
    edit: 'setting:edit',
    delete: 'setting:delete',
  },
  article: {
    list: 'article:list',
    create: 'article:create',
    view: 'article:view',
    edit: 'article:edit',
    delete: 'article:delete',
    submit: 'article:submit',
    withdraw: 'article:withdraw',
    approve: 'article:approve',
    status: 'article:status',
  },
  category: {
    list: 'category:list',
    create: 'category:create',
    view: 'category:view',
    edit: 'category:edit',
    delete: 'category:delete',
  },
  tag: {
    list: 'tag:list',
    create: 'tag:create',
    view: 'tag:view',
    edit: 'tag:edit',
    delete: 'tag:delete',
  },
} as const

export const getMenuPermission = (pathname: string) =>
  Object.entries(ROUTE_PERMISSIONS)
    .sort(([a], [b]) => b.length - a.length)
    .find(([route]) => pathname === route || pathname.startsWith(`${route}/`))?.[1]

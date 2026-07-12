export const MENU_PERMISSIONS = {
  reviews: '/admin/reviews/articles',
  users: '/admin/system/users',
  roles: '/admin/system/roles',
  accesses: '/admin/system/accesses',
  articles: '/admin/content/articles',
  categories: '/admin/content/categories',
  tags: '/admin/content/tags',
} as const

export const BUTTON_PERMISSIONS = {
  user: { create: 'user:create', view: 'user:view', edit: 'user:edit', delete: 'user:delete' },
  role: { create: 'role:create', view: 'role:view', edit: 'role:edit', delete: 'role:delete' },
  access: {
    create: 'access:create',
    view: 'access:view',
    edit: 'access:edit',
    delete: 'access:delete',
  },
  article: {
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
    create: 'category:create',
    view: 'category:view',
    edit: 'category:edit',
    delete: 'category:delete',
  },
  tag: { create: 'tag:create', view: 'tag:view', edit: 'tag:edit', delete: 'tag:delete' },
} as const

export const getMenuPermission = (pathname: string) =>
  Object.values(MENU_PERMISSIONS)
    .sort((a, b) => b.length - a.length)
    .find((permission) => pathname === permission || pathname.startsWith(`${permission}/`))

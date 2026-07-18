export const queryKeys = {
  auth: { me: ['auth', 'me'] as const },
  users: {
    all: ['users'] as const,
    list: (query: unknown) => ['users', 'list', query] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  roles: {
    all: ['roles'] as const,
    list: (query: unknown) => ['roles', 'list', query] as const,
    detail: (id: number) => ['roles', 'detail', id] as const,
  },
  accesses: {
    all: ['accesses'] as const,
    tree: ['accesses', 'tree'] as const,
    detail: (id: number) => ['accesses', 'detail', id] as const,
  },
  articles: {
    all: ['articles'] as const,
    list: (query: unknown) => ['articles', 'list', query] as const,
    detail: (id: number) => ['articles', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    tree: ['categories', 'tree'] as const,
    detail: (id: number) => ['categories', 'detail', id] as const,
  },
  tags: {
    all: ['tags'] as const,
    list: (query: unknown) => ['tags', 'list', query] as const,
    detail: (id: number) => ['tags', 'detail', id] as const,
  },
  settings: {
    all: ['settings'] as const,
    detail: (key: string) => ['settings', 'detail', key] as const,
    public: ['settings', 'public'] as const,
  },
  dashboard: {
    weather: ['dashboard', 'weather'] as const,
    system: ['dashboard', 'system'] as const,
  },
}

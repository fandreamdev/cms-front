import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { getAccessTree, type AccessTree } from '../../api/access'
import { getArticleList, type ArticleApprovalStatus, type ArticleQuery } from '../../api/article'
import { hasPermission, type CurrentUser } from '../../api/auth'
import { getCategoryTree, type Category } from '../../api/category'
import { getRoleList } from '../../api/role'
import { getWebsiteSettings } from '../../api/setting'
import { getTagList } from '../../api/tag'
import { getUserList } from '../../api/user'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { approvalStatusMap } from '../article/approval'

const approvalStatuses: ArticleApprovalStatus[] = [
  'draft',
  'pending',
  'approved',
  'rejected',
  'withdrawn',
]

const countTreeNodes = <T extends { children?: T[] }>(nodes: T[]): number =>
  nodes.reduce((total, node) => total + 1 + countTreeNodes(node.children ?? []), 0)

const flattenTreeNodes = <T extends { children?: T[] }>(nodes: T[]): T[] =>
  nodes.flatMap((node) => [node, ...flattenTreeNodes(node.children ?? [])])

const latestFirst = <T extends { updatedAt: string }>(items: T[]) =>
  [...items].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)).slice(0, 5)

export interface DashboardRecentItem {
  key: string | number
  title: string
  description: string
  updatedAt: string
  tag?: { text: string; color?: string }
}

export interface DashboardRecentSection {
  key: string
  label: string
  items: DashboardRecentItem[]
}

export interface DashboardGrowthMetric {
  current: number
  previous: number
  rate: number | null
  trend: 'up' | 'down' | 'flat'
}

const calculateGrowth = (current: number, previous: number): DashboardGrowthMetric => {
  const rate = previous === 0 ? (current === 0 ? 0 : null) : ((current - previous) / previous) * 100
  return {
    current,
    previous,
    rate: rate === null ? null : Math.round(rate * 10) / 10,
    trend: current > previous ? 'up' : current < previous ? 'down' : 'flat',
  }
}

const countCreatedInRange = <T extends { createdAt: string }>(
  items: T[],
  from: string,
  to: string,
) => items.filter((item) => item.createdAt >= from && item.createdAt < to).length

const countArticleQuery = (params: ArticleQuery) =>
  getArticleList({ ...params, page: 1, pageSize: 1 })

export const useDashboardData = (user: CurrentUser | null) => {
  const growthPeriod = useMemo(() => {
    const currentTo = new Date()
    const currentFrom = new Date(currentTo.getTime() - 7 * 24 * 60 * 60 * 1000)
    const previousFrom = new Date(currentFrom.getTime() - 7 * 24 * 60 * 60 * 1000)
    return {
      days: 7,
      currentFrom: currentFrom.toISOString(),
      currentTo: currentTo.toISOString(),
      previousFrom: previousFrom.toISOString(),
    }
  }, [])
  const permissions = {
    articles: hasPermission(user, BUTTON_PERMISSIONS.article.list),
    categories: hasPermission(user, BUTTON_PERMISSIONS.category.list),
    tags: hasPermission(user, BUTTON_PERMISSIONS.tag.list),
    users: hasPermission(user, BUTTON_PERMISSIONS.user.list),
    roles: hasPermission(user, BUTTON_PERMISSIONS.role.list),
    accesses: hasPermission(user, BUTTON_PERMISSIONS.access.list),
    settings: hasPermission(user, BUTTON_PERMISSIONS.setting.list),
  }

  const articleOverview = useQuery({
    queryKey: ['dashboard', 'articles', 'overview'],
    queryFn: () => getArticleList({ page: 1, pageSize: 5, orderBy: 'updatedAt', order: 'desc' }),
    enabled: permissions.articles,
  })

  const approvalQueries = useQueries({
    queries: approvalStatuses.map((status) => ({
      queryKey: ['dashboard', 'articles', 'approval', status],
      queryFn: () => countArticleQuery({ approvalStatus: status }),
      enabled: permissions.articles,
    })),
  })

  const publicationQueries = useQueries({
    queries: [0, 1].map((status) => ({
      queryKey: ['dashboard', 'articles', 'publication', status],
      queryFn: () => countArticleQuery({ status }),
      enabled: permissions.articles,
    })),
  })

  const articleGrowthQueries = useQueries({
    queries: [
      { from: growthPeriod.currentFrom, to: growthPeriod.currentTo },
      { from: growthPeriod.previousFrom, to: growthPeriod.currentFrom },
    ].map(({ from, to }) => ({
      queryKey: ['dashboard', 'articles', 'growth', from, to],
      queryFn: () => countArticleQuery({ createdFrom: from, createdTo: to }),
      enabled: permissions.articles,
    })),
  })

  const categories = useQuery({
    queryKey: ['dashboard', 'categories'],
    queryFn: getCategoryTree,
    enabled: permissions.categories,
  })
  const tags = useQuery({
    queryKey: ['dashboard', 'tags'],
    queryFn: () => getTagList({ page: 1, pageSize: 5, orderBy: 'updatedAt', order: 'desc' }),
    enabled: permissions.tags,
  })
  const users = useQuery({
    queryKey: ['dashboard', 'users'],
    queryFn: () => getUserList({ page: 1, pageSize: 5, orderBy: 'updatedAt', order: 'desc' }),
    enabled: permissions.users,
  })
  const roles = useQuery({
    queryKey: ['dashboard', 'roles'],
    queryFn: () => getRoleList({ page: 1, pageSize: 5, orderBy: 'updatedAt', order: 'desc' }),
    enabled: permissions.roles,
  })
  const accesses = useQuery({
    queryKey: ['dashboard', 'accesses'],
    queryFn: getAccessTree,
    enabled: permissions.accesses,
  })
  const settings = useQuery({
    queryKey: ['dashboard', 'settings'],
    queryFn: getWebsiteSettings,
    enabled: permissions.settings,
  })

  const tagGrowthQueries = useQueries({
    queries: [
      { from: growthPeriod.currentFrom, to: growthPeriod.currentTo },
      { from: growthPeriod.previousFrom, to: growthPeriod.currentFrom },
    ].map(({ from, to }) => ({
      queryKey: ['dashboard', 'tags', 'growth', from, to],
      queryFn: () => getTagList({ page: 1, pageSize: 1, createdFrom: from, createdTo: to }),
      enabled: permissions.tags,
    })),
  })
  const userGrowthQueries = useQueries({
    queries: [
      { from: growthPeriod.currentFrom, to: growthPeriod.currentTo },
      { from: growthPeriod.previousFrom, to: growthPeriod.currentFrom },
    ].map(({ from, to }) => ({
      queryKey: ['dashboard', 'users', 'growth', from, to],
      queryFn: () => getUserList({ page: 1, pageSize: 1, createdFrom: from, createdTo: to }),
      enabled: permissions.users,
    })),
  })
  const roleGrowthQueries = useQueries({
    queries: [
      { from: growthPeriod.currentFrom, to: growthPeriod.currentTo },
      { from: growthPeriod.previousFrom, to: growthPeriod.currentFrom },
    ].map(({ from, to }) => ({
      queryKey: ['dashboard', 'roles', 'growth', from, to],
      queryFn: () => getRoleList({ page: 1, pageSize: 1, createdFrom: from, createdTo: to }),
      enabled: permissions.roles,
    })),
  })

  const growthFromQueries = (queries: Array<{ data?: { total: number } }>) =>
    calculateGrowth(queries[0].data?.total ?? 0, queries[1].data?.total ?? 0)
  const growthFromCompleteList = <T extends { createdAt: string }>(items: T[]) =>
    calculateGrowth(
      countCreatedInRange(items, growthPeriod.currentFrom, growthPeriod.currentTo),
      countCreatedInRange(items, growthPeriod.previousFrom, growthPeriod.currentFrom),
    )

  const approvalData = approvalStatuses.map((status, index) => ({
    status,
    value: approvalQueries[index].data?.total ?? 0,
  }))
  const publicationData = [
    { status: '已下架', value: publicationQueries[0].data?.total ?? 0 },
    { status: '已上架', value: publicationQueries[1].data?.total ?? 0 },
  ]
  const moduleData = [
    permissions.articles
      ? {
          name: '文章',
          value: articleOverview.data?.total ?? 0,
          color: '#1677ff',
          growth: growthFromQueries(articleGrowthQueries),
        }
      : null,
    permissions.categories
      ? {
          name: '分类',
          value: countTreeNodes((categories.data ?? []) as Category[]),
          color: '#722ed1',
          growth: growthFromCompleteList(flattenTreeNodes(categories.data ?? [])),
        }
      : null,
    permissions.tags
      ? {
          name: '标签',
          value: tags.data?.total ?? 0,
          color: '#13c2c2',
          growth: growthFromQueries(tagGrowthQueries),
        }
      : null,
    permissions.users
      ? {
          name: '用户',
          value: users.data?.total ?? 0,
          color: '#fa8c16',
          growth: growthFromQueries(userGrowthQueries),
        }
      : null,
    permissions.roles
      ? {
          name: '角色',
          value: roles.data?.total ?? 0,
          color: '#eb2f96',
          growth: growthFromQueries(roleGrowthQueries),
        }
      : null,
    permissions.accesses
      ? {
          name: '权限资源',
          value: countTreeNodes((accesses.data ?? []) as AccessTree[]),
          color: '#52c41a',
          growth: growthFromCompleteList(flattenTreeNodes(accesses.data ?? [])),
        }
      : null,
    permissions.settings
      ? {
          name: '网站设置',
          value: settings.data?.length ?? 0,
          color: '#2f54eb',
          growth: growthFromCompleteList(settings.data ?? []),
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const recentSections: Array<DashboardRecentSection | null> = [
    permissions.articles
      ? {
          key: 'articles',
          label: '文章',
          items: latestFirst(articleOverview.data?.list ?? []).map((article) => ({
            key: article.id,
            title: article.title,
            description: article.category?.name ?? '未分类',
            updatedAt: article.updatedAt,
            tag: {
              text: approvalStatusMap[article.approvalStatus].text,
              color: approvalStatusMap[article.approvalStatus].color,
            },
          })),
        }
      : null,
    permissions.categories
      ? {
          key: 'categories',
          label: '分类',
          items: latestFirst(flattenTreeNodes(categories.data ?? [])).map((category) => ({
            key: category.id,
            title: category.name,
            description: category.description || '暂无描述',
            updatedAt: category.updatedAt,
          })),
        }
      : null,
    permissions.tags
      ? {
          key: 'tags',
          label: '标签',
          items: latestFirst(tags.data?.list ?? []).map((tag) => ({
            key: tag.id,
            title: tag.name,
            description: tag.description || '暂无描述',
            updatedAt: tag.updatedAt,
          })),
        }
      : null,
    permissions.users
      ? {
          key: 'users',
          label: '用户',
          items: latestFirst(users.data?.list ?? []).map((account) => ({
            key: account.id,
            title: account.username,
            description: account.email || account.mobile || '未填写联系方式',
            updatedAt: account.updatedAt,
            tag: {
              text: account.status === 1 ? '启用' : '禁用',
              color: account.status === 1 ? 'success' : 'default',
            },
          })),
        }
      : null,
    permissions.roles
      ? {
          key: 'roles',
          label: '角色',
          items: latestFirst(roles.data?.list ?? []).map((role) => ({
            key: role.id,
            title: role.name,
            description: '角色权限配置',
            updatedAt: role.updatedAt,
          })),
        }
      : null,
    permissions.accesses
      ? {
          key: 'accesses',
          label: '权限资源',
          items: latestFirst(flattenTreeNodes(accesses.data ?? [])).map((access) => ({
            key: access.id,
            title: access.description,
            description: access.url,
            updatedAt: access.updatedAt,
            tag: {
              text: access.type === 'module' ? '模块' : access.type === 'menu' ? '菜单' : '功能',
              color: access.type === 'module' ? 'purple' : access.type === 'menu' ? 'blue' : 'cyan',
            },
          })),
        }
      : null,
    permissions.settings
      ? {
          key: 'settings',
          label: '网站设置',
          items: latestFirst(settings.data ?? []).map((setting) => ({
            key: setting.key,
            title: setting.key,
            description: setting.description || '暂无描述',
            updatedAt: setting.updatedAt,
            tag: {
              text: setting.isPublic ? '公开' : '私有',
              color: setting.isPublic ? 'success' : 'default',
            },
          })),
        }
      : null,
  ]
  const latestSections = recentSections.filter(
    (section): section is DashboardRecentSection => section !== null,
  )

  const allQueries = [
    articleOverview,
    ...approvalQueries,
    ...publicationQueries,
    ...articleGrowthQueries,
    categories,
    tags,
    users,
    roles,
    accesses,
    settings,
    ...tagGrowthQueries,
    ...userGrowthQueries,
    ...roleGrowthQueries,
  ]

  return {
    permissions,
    articleOverview: articleOverview.data,
    approvalData,
    publicationData,
    moduleData,
    latestSections,
    growthPeriodDays: growthPeriod.days,
    loading: allQueries.some((query) => query.isFetching),
  }
}

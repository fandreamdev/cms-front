import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import {
  AuditOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  CloudOutlined,
  CloudServerOutlined,
  FileAddOutlined,
  FileTextOutlined,
  FolderOutlined,
  KeyOutlined,
  MailOutlined,
  MinusOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TagsOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserOutlined,
  SunOutlined,
} from '@ant-design/icons'
import {
  Card,
  Col,
  Empty,
  List,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tag,
  Tabs,
  Typography,
} from 'antd'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getPublicWebsiteSettings } from '../api/setting'
import { getDashboardWeather } from '../api/dashboard'
import { queryKeys } from '../app/queryKeys'
import { approvalStatusMap } from './article/approval'
import { useAuth } from '../contexts/authContextValue'
import { hasPermission } from '../api/auth'
import { BUTTON_PERMISSIONS, MENU_PERMISSIONS } from '../config/permissions'
import { getPublicStringSetting, WEBSITE_SETTING_KEYS } from '../config/websiteSettings'
import { useDashboardData } from './dashboard/useDashboardData'
import { useThemeMode } from '../contexts/themeContextValue'
import './HomePage.css'

const approvalColors: Record<string, string> = {
  draft: '#94a3b8',
  pending: '#1677ff',
  approved: '#52c41a',
  rejected: '#ff4d4f',
  withdrawn: '#faad14',
}

const getWeatherIcon = (conditionCode: number) => {
  if (conditionCode === 0) return <SunOutlined />
  if (conditionCode >= 95) return <ThunderboltOutlined />
  return <CloudOutlined />
}

const HomePage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isDark } = useThemeMode()
  const chartGridColor = isDark ? '#303030' : '#eef2f7'
  const canMonitorSystem = hasPermission(user, BUTTON_PERMISSIONS.system.monitor)
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: getPublicWebsiteSettings,
  })
  const {
    data: weather,
    isLoading: weatherLoading,
    isError: weatherError,
  } = useQuery({
    queryKey: queryKeys.dashboard.weather,
    queryFn: getDashboardWeather,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
  })
  const dashboard = useDashboardData(user)
  const name = getPublicStringSetting(settings, WEBSITE_SETTING_KEYS.name, 'CMS')
  const description = getPublicStringSetting(
    settings,
    WEBSITE_SETTING_KEYS.description,
    '内容管理系统',
  )
  const contactEmail = getPublicStringSetting(
    settings,
    WEBSITE_SETTING_KEYS.contactEmail,
    'contact@example.com',
  )

  const statCards = [
    dashboard.permissions.articles
      ? {
          title: '文章总数',
          value: dashboard.articleOverview?.total ?? 0,
          icon: <FileTextOutlined />,
          color: '#1677ff',
          growth: dashboard.moduleData.find((item) => item.name === '文章')?.growth,
        }
      : null,
    ...dashboard.moduleData
      .filter((item) => item.name !== '文章')
      .map((item) => ({
        title: `${item.name}总数`,
        value: item.value,
        icon:
          item.name === '分类' ? (
            <FolderOutlined />
          ) : item.name === '标签' ? (
            <TagsOutlined />
          ) : item.name === '用户' ? (
            <UserOutlined />
          ) : item.name === '角色' ? (
            <TeamOutlined />
          ) : item.name === '权限资源' ? (
            <KeyOutlined />
          ) : (
            <SettingOutlined />
          ),
        color: item.color,
        growth: item.growth,
      })),
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const quickActions = [
    hasPermission(user, BUTTON_PERMISSIONS.article.create)
      ? {
          title: '新增文章',
          description: '创建并编辑一篇新文章',
          icon: <FileAddOutlined />,
          color: '#1677ff',
          to: '/admin/content/articles/new',
        }
      : null,
    hasPermission(user, BUTTON_PERMISSIONS.article.list)
      ? {
          title: '文章管理',
          description: '查看文章、状态和发布情况',
          icon: <FileTextOutlined />,
          color: '#13c2c2',
          to: '/admin/content/articles',
        }
      : null,
    hasPermission(user, MENU_PERMISSIONS.reviews)
      ? {
          title: '文章审批',
          description: '处理待审批文章',
          icon: <AuditOutlined />,
          color: '#fa8c16',
          to: '/admin/reviews/articles',
        }
      : null,
    hasPermission(user, BUTTON_PERMISSIONS.user.list)
      ? {
          title: '用户管理',
          description: '维护用户状态和角色',
          icon: <TeamOutlined />,
          color: '#722ed1',
          to: '/admin/system/users',
        }
      : null,
    hasPermission(user, BUTTON_PERMISSIONS.role.list)
      ? {
          title: '角色权限',
          description: '配置角色及访问权限',
          icon: <SafetyCertificateOutlined />,
          color: '#eb2f96',
          to: '/admin/system/roles',
        }
      : null,
    hasPermission(user, BUTTON_PERMISSIONS.setting.list)
      ? {
          title: '网站设置',
          description: '维护站点名称和公开信息',
          icon: <SettingOutlined />,
          color: '#2f54eb',
          to: '/admin/system/settings',
        }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const approvalChartData = dashboard.approvalData.map((item) => ({
    ...item,
    name: approvalStatusMap[item.status].text,
  }))
  return (
    <div className="dashboard-page">
      <section className="dashboard-hero">
        {settingsLoading ? (
          <Skeleton active paragraph={{ rows: 2 }} />
        ) : (
          <Row align="middle" justify="space-between" gutter={[24, 24]}>
            <Col>
              <Typography.Text className="dashboard-eyebrow">
                欢迎回来，{user?.username ?? '管理员'}
              </Typography.Text>
              <Typography.Title level={1}>{name}</Typography.Title>
              <Typography.Paragraph>{description}</Typography.Paragraph>
            </Col>
            <Col>
              <Space direction="vertical" size="middle" align="end">
                {weatherLoading ? (
                  <div className="dashboard-weather dashboard-weather-loading">正在加载天气…</div>
                ) : weatherError || !weather ? (
                  <div className="dashboard-weather dashboard-weather-unavailable">
                    <CloudOutlined /> 天气暂不可用
                  </div>
                ) : (
                  <div className="dashboard-weather">
                    <span className="dashboard-weather-icon">
                      {getWeatherIcon(weather.current.conditionCode)}
                    </span>
                    <span className="dashboard-weather-temperature">
                      {Math.round(weather.current.temperature)}°
                    </span>
                    <span className="dashboard-weather-detail">
                      <strong>
                        {weather.location.name} · {weather.current.conditionText}
                      </strong>
                      <small>
                        体感 {Math.round(weather.current.feelsLike)}° · 湿度{' '}
                        {Math.round(weather.current.humidity)}% · 风速{' '}
                        {Math.round(weather.current.windSpeed)} km/h
                      </small>
                    </span>
                  </div>
                )}
                <Typography.Link className="dashboard-email" href={`mailto:${contactEmail}`}>
                  <MailOutlined /> {contactEmail}
                </Typography.Link>
              </Space>
            </Col>
          </Row>
        )}
      </section>

      {statCards.length > 0 && (
        <Row gutter={[16, 16]}>
          {statCards.map((item) => (
            <Col xs={24} sm={12} xl={6} key={item.title}>
              <Card className="dashboard-stat-card" loading={dashboard.loading && item.value === 0}>
                <div
                  className="dashboard-stat-icon"
                  style={{ color: item.color, background: `${item.color}18` }}
                >
                  {item.icon}
                </div>
                <Statistic title={item.title} value={item.value} />
                {item.growth && (
                  <div className={`dashboard-growth dashboard-growth-${item.growth.trend}`}>
                    <span>
                      {item.growth.trend === 'up' ? (
                        <ArrowUpOutlined />
                      ) : item.growth.trend === 'down' ? (
                        <ArrowDownOutlined />
                      ) : (
                        <MinusOutlined />
                      )}{' '}
                      {item.growth.rate === null
                        ? `本期新增 ${item.growth.current}`
                        : `${Math.abs(item.growth.rate)}%`}
                    </span>
                    <small>较前 {dashboard.growthPeriodDays} 天</small>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Card title="快捷操作" className="dashboard-card">
        {quickActions.length ? (
          <Row gutter={[16, 16]}>
            {quickActions.map((action) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={action.title}>
                <button
                  type="button"
                  className="dashboard-action"
                  onClick={() => navigate({ to: action.to as never })}
                >
                  <span
                    className="dashboard-action-icon"
                    style={{ color: action.color, background: `${action.color}18` }}
                  >
                    {action.icon}
                  </span>
                  <span>
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>
                </button>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用快捷操作" />
        )}
      </Card>

      {canMonitorSystem && (
        <Card title="系统实时监控" className="dashboard-card">
          <button
            type="button"
            className="dashboard-action dashboard-system-entry"
            onClick={() => navigate({ to: '/admin/system/status' })}
          >
            <span
              className="dashboard-action-icon"
              style={{ color: '#1677ff', background: '#1677ff18' }}
            >
              <CloudServerOutlined />
            </span>
            <span>
              <strong>打开系统状态页面</strong>
              <small>通过 WebSocket 实时查看每个 CPU 核心、磁盘分区、网卡和 Node.js 进程</small>
            </span>
          </button>
        </Card>
      )}

      {dashboard.permissions.articles && (
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={12}>
            <Card title="文章审批状态" className="dashboard-card">
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={approvalChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="46%"
                      innerRadius={66}
                      outerRadius={104}
                      paddingAngle={3}
                    >
                      {approvalChartData.map((item) => (
                        <Cell key={item.status} fill={approvalColors[item.status]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value} 篇`, '文章数量']} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
          <Col xs={24} xl={12}>
            <Card title="文章发布状态" className="dashboard-card">
              <div className="dashboard-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.publicationData}
                    margin={{ top: 24, right: 24, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                    <XAxis dataKey="status" axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                    <RechartsTooltip formatter={(value) => [`${value} 篇`, '文章数量']} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={84}>
                      <Cell fill="#94a3b8" />
                      <Cell fill="#52c41a" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {dashboard.moduleData.length > 0 && (
          <Col xs={24} xl={14}>
            <Card title="功能模块数据概览" className="dashboard-card">
              <div className="dashboard-chart dashboard-module-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboard.moduleData}
                    layout="vertical"
                    margin={{ top: 8, right: 32, left: 18, bottom: 8 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke={chartGridColor}
                    />
                    <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={72}
                      axisLine={false}
                      tickLine={false}
                    />
                    <RechartsTooltip formatter={(value) => [`${value} 条`, '数据量']} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={24}>
                      {dashboard.moduleData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        )}
        {dashboard.latestSections.length > 0 && (
          <Col xs={24} xl={dashboard.moduleData.length > 0 ? 10 : 24}>
            <Card title="最新数据" className="dashboard-card dashboard-recent-card">
              <Tabs
                size="small"
                items={dashboard.latestSections.map((section) => ({
                  key: section.key,
                  label: section.label,
                  children: (
                    <List
                      loading={dashboard.loading && section.items.length === 0}
                      dataSource={section.items}
                      locale={{ emptyText: `暂无${section.label}数据` }}
                      renderItem={(item) => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Space size={8} wrap>
                                <Typography.Text ellipsis style={{ maxWidth: 230 }}>
                                  {item.title}
                                </Typography.Text>
                                {item.tag && <Tag color={item.tag.color}>{item.tag.text}</Tag>}
                              </Space>
                            }
                            description={
                              <Space size={8} split="·">
                                <Typography.Text
                                  type="secondary"
                                  ellipsis
                                  style={{ maxWidth: 180 }}
                                >
                                  {item.description}
                                </Typography.Text>
                                <Typography.Text type="secondary">
                                  {new Date(item.updatedAt).toLocaleDateString()}
                                </Typography.Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ),
                }))}
              />
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}

export default HomePage

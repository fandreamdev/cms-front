import { useQuery } from '@tanstack/react-query'
import {
  CloudServerOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  HddOutlined,
} from '@ant-design/icons'
import {
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Result,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getDashboardSystemStatus } from '../../api/dashboard'
import { hasPermission } from '../../api/auth'
import { queryKeys } from '../../app/queryKeys'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { useAuth } from '../../contexts/authContextValue'
import { useThemeMode } from '../../contexts/themeContextValue'
import { useSystemStatusSocket } from './useSystemStatusSocket'
import '../HomePage.css'

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** unitIndex
  return `${value >= 100 ? Math.round(value) : value.toFixed(1)} ${units[unitIndex]}`
}

const formatRate = (bytes: number) => `${formatBytes(bytes)}/s`
const getUsageColor = (usage: number) =>
  usage >= 90 ? '#ff4d4f' : usage >= 75 ? '#faad14' : '#1677ff'

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return [days ? `${days} 天` : '', hours ? `${hours} 小时` : '', `${minutes} 分钟`]
    .filter(Boolean)
    .join(' ')
}

const connectionMeta = {
  idle: { color: 'default', text: '未连接' },
  connecting: { color: 'processing', text: '正在连接' },
  connected: { color: 'success', text: '实时连接' },
  reconnecting: { color: 'warning', text: '正在重连' },
  error: { color: 'error', text: '连接失败' },
} as const

const statusMeta = {
  healthy: { color: 'success', text: '运行正常' },
  warning: { color: 'warning', text: '需要关注' },
  critical: { color: 'error', text: '运行异常' },
} as const

const SystemStatusPage = () => {
  const { user } = useAuth()
  const { isDark } = useThemeMode()
  const permitted = hasPermission(user, BUTTON_PERMISSIONS.system.monitor)
  const initialQuery = useQuery({
    queryKey: queryKeys.dashboard.system,
    queryFn: getDashboardSystemStatus,
    enabled: permitted,
    staleTime: 0,
    refetchOnWindowFocus: false,
  })
  const socket = useSystemStatusSocket(permitted)
  const status = socket.data ?? initialQuery.data
  const chartGridColor = isDark ? '#303030' : '#eef2f7'
  const history =
    status?.history.map((sample) => ({
      ...sample,
      time: new Date(sample.sampledAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    })) ?? []

  if (!permitted) return <Result status="403" title="403" subTitle="没有服务器监控权限" />

  if (!status && initialQuery.isLoading) return <Skeleton active paragraph={{ rows: 12 }} />

  if (!status)
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={socket.error ?? '服务器状态暂不可用'}
      />
    )

  const heapUsage = status.process.heapTotal
    ? (status.process.heapUsed / status.process.heapTotal) * 100
    : 0

  return (
    <div className="dashboard-page system-status-page">
      <Card className="dashboard-card dashboard-system-card">
        <div className="system-status-header">
          <div>
            <Typography.Title level={2}>系统实时状态</Typography.Title>
            <Typography.Text type="secondary">
              {status.instance.hostname} · 数据时间 {new Date(status.sampledAt).toLocaleString()}
            </Typography.Text>
          </div>
          <Space wrap>
            <Tag color={connectionMeta[socket.state].color}>
              {connectionMeta[socket.state].text}
            </Tag>
            <Tag color={statusMeta[status.status].color}>{statusMeta[status.status].text}</Tag>
            {socket.error && <Typography.Text type="warning">{socket.error}</Typography.Text>}
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {[
            ['CPU', status.cpu.usage, `${status.cpu.cores} 个逻辑核心`, <DashboardOutlined />],
            [
              '内存',
              status.memory.usage,
              `${formatBytes(status.memory.used)} / ${formatBytes(status.memory.total)}`,
              <DatabaseOutlined />,
            ],
            [
              '最高磁盘',
              Math.max(0, ...status.disks.map((disk) => disk.usage)),
              `${status.disks.length} 个分区或挂载点`,
              <HddOutlined />,
            ],
            [
              'Node.js Heap',
              heapUsage,
              `进程 CPU ${status.process.cpuUsage.toFixed(1)}%`,
              <CloudServerOutlined />,
            ],
          ].map(([label, usage, detail, icon]) => (
            <Col xs={12} lg={6} key={String(label)}>
              <div className="dashboard-resource">
                <Progress
                  type="dashboard"
                  percent={Math.round(Number(usage))}
                  strokeColor={getUsageColor(Number(usage))}
                  size={104}
                />
                <strong>
                  {icon} {label}
                </strong>
                <small>{detail}</small>
              </div>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]} className="dashboard-system-details">
          <Col xs={24} xl={14}>
            <Typography.Title level={5}>CPU 每核心状态</Typography.Title>
            <div className="dashboard-core-grid">
              {status.cpu.perCore.map((core) => (
                <div className="dashboard-core" key={core.index}>
                  <div className="dashboard-core-heading">
                    <strong>CPU {core.index}</strong>
                    <span style={{ color: getUsageColor(core.usage) }}>
                      {core.usage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress
                    percent={Math.round(core.usage)}
                    showInfo={false}
                    strokeColor={getUsageColor(core.usage)}
                    size="small"
                  />
                  <small>
                    {core.speedMHz == null ? '频率未知' : `${Math.round(core.speedMHz)} MHz`}
                    {core.temperature == null ? '' : ` · ${core.temperature.toFixed(1)}°C`}
                  </small>
                </div>
              ))}
            </div>
          </Col>
          <Col xs={24} xl={10}>
            <Typography.Title level={5}>CPU / 内存趋势</Typography.Title>
            <div className="dashboard-resource-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 12, right: 16, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={24} />
                  <YAxis domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    formatter={(value, key) => [
                      `${Number(value).toFixed(1)}%`,
                      key === 'cpuUsage' ? 'CPU' : '内存',
                    ]}
                  />
                  <Legend formatter={(key) => (key === 'cpuUsage' ? 'CPU 使用率' : '内存使用率')} />
                  <Area
                    type="monotone"
                    dataKey="cpuUsage"
                    stroke="#1677ff"
                    fill="#1677ff"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="memoryUsage"
                    stroke="#722ed1"
                    fill="#722ed1"
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Col>
        </Row>

        <div className="dashboard-system-section">
          <Typography.Title level={5}>内存明细</Typography.Title>
          <div className="dashboard-memory-grid">
            {[
              ['总内存', status.memory.total],
              ['已使用', status.memory.used],
              ['可用', status.memory.available],
              ['空闲', status.memory.free],
              ['缓存', status.memory.cached],
              ['缓冲区', status.memory.buffers],
              ['活跃内存', status.memory.active],
              ['Swap 已使用', status.memory.swap.used],
            ].map(([label, value]) => (
              <div className="dashboard-memory-item" key={String(label)}>
                <small>{label}</small>
                <strong>{value == null ? '-' : formatBytes(Number(value))}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-system-section">
          <Typography.Title level={5}>全部磁盘与分区</Typography.Title>
          <div className="dashboard-disk-grid">
            {status.disks.map((disk) => (
              <div className="dashboard-disk" key={`${disk.device}-${disk.mount}`}>
                <div className="dashboard-disk-heading">
                  <span className="dashboard-disk-icon">
                    <HddOutlined />
                  </span>
                  <span>
                    <strong>{disk.device}</strong>
                    <small>
                      {disk.mount} · {disk.filesystem ?? '未知文件系统'}
                      {disk.type ? ` · ${disk.type}` : ''}
                    </small>
                  </span>
                  <Tag color={disk.usage >= 90 ? 'error' : disk.usage >= 75 ? 'warning' : 'blue'}>
                    {disk.usage.toFixed(1)}%
                  </Tag>
                </div>
                <Progress
                  percent={Math.round(disk.usage)}
                  showInfo={false}
                  strokeColor={getUsageColor(disk.usage)}
                />
                <div className="dashboard-disk-meta">
                  <span>已用 {formatBytes(disk.used)}</span>
                  <span>可用 {formatBytes(disk.available)}</span>
                  <span>容量 {formatBytes(disk.total)}</span>
                </div>
                <div className="dashboard-disk-io">
                  <span>读取 {formatRate(disk.readPerSecond ?? 0)}</span>
                  <span>写入 {formatRate(disk.writePerSecond ?? 0)}</span>
                  <span>读 IOPS {disk.readIops?.toFixed(0) ?? '-'}</span>
                  <span>写 IOPS {disk.writeIops?.toFixed(0) ?? '-'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Row gutter={[24, 24]} className="dashboard-system-details">
          <Col xs={24} xl={15}>
            <Typography.Title level={5}>网络实时流量</Typography.Title>
            <div className="dashboard-network-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 12, right: 18, left: 12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={76}
                    tickFormatter={(value) => formatRate(Number(value))}
                  />
                  <RechartsTooltip
                    formatter={(value, name) => [
                      formatRate(Number(value)),
                      name === 'inboundPerSecond' ? '入站' : '出站',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'inboundPerSecond' ? '入站流量' : '出站流量')}
                  />
                  <Area
                    type="monotone"
                    dataKey="inboundPerSecond"
                    stroke="#1677ff"
                    fill="#1677ff"
                    fillOpacity={0.12}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="outboundPerSecond"
                    stroke="#52c41a"
                    fill="#52c41a"
                    fillOpacity={0.08}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="dashboard-interface-grid">
              {status.network.interfaces.map((item) => (
                <div className="dashboard-interface" key={item.name}>
                  <div>
                    <strong>{item.name}</strong>
                    <Tag color={item.state === 'up' ? 'success' : 'default'}>
                      {item.state.toUpperCase()}
                    </Tag>
                  </div>
                  <small>
                    {item.type ?? '未知类型'}
                    {item.speedMbps == null ? '' : ` · ${item.speedMbps} Mbps`}
                  </small>
                  <span>↓ {formatRate(item.inboundPerSecond)}</span>
                  <span>↑ {formatRate(item.outboundPerSecond)}</span>
                  <small>
                    累计接收 {formatBytes(item.totalReceived ?? 0)} · 发送{' '}
                    {formatBytes(item.totalSent ?? 0)}
                  </small>
                </div>
              ))}
            </div>
          </Col>
          <Col xs={24} xl={9}>
            <Typography.Title level={5}>实例与运行时</Typography.Title>
            <Descriptions
              size="small"
              column={1}
              bordered
              items={[
                { label: '实例', children: status.instance.hostname },
                {
                  label: '系统',
                  children: `${status.instance.platform} ${status.instance.release} / ${status.instance.arch}`,
                },
                {
                  label: '环境',
                  children: status.instance.containerized
                    ? `容器 · ${status.instance.virtualization ?? 'unknown'}`
                    : (status.instance.virtualization ?? '物理机'),
                },
                { label: '运行时长', children: formatUptime(status.instance.uptime) },
                {
                  label: '系统负载',
                  children: status.cpu.loadAverage.map((value) => value.toFixed(2)).join(' / '),
                },
                {
                  label: 'CPU',
                  children: `${status.cpu.model} · ${status.cpu.cores} 逻辑核心${status.cpu.physicalCores ? ` / ${status.cpu.physicalCores} 物理核心` : ''}`,
                },
                { label: 'Node.js', children: status.process.nodeVersion },
                { label: '进程运行', children: formatUptime(status.process.uptime) },
                {
                  label: '进程内存',
                  children: `RSS ${formatBytes(status.process.rss)} · Heap ${formatBytes(status.process.heapUsed)} / ${formatBytes(status.process.heapTotal)}`,
                },
                {
                  label: 'External / ArrayBuffer',
                  children: `${formatBytes(status.process.external)} / ${formatBytes(status.process.arrayBuffers)}`,
                },
                {
                  label: '事件循环延迟',
                  children:
                    status.process.eventLoopLag == null
                      ? '-'
                      : `${status.process.eventLoopLag.toFixed(1)} ms`,
                },
                {
                  label: '活动句柄 / 请求',
                  children: `${status.process.activeHandles ?? '-'} / ${status.process.activeRequests ?? '-'}`,
                },
              ]}
            />
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default SystemStatusPage

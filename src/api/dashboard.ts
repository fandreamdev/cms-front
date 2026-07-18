import request from '../utils/request'

export interface DashboardWeather {
  location: {
    name: string
    region?: string | null
    country?: string | null
  }
  current: {
    conditionCode: number
    conditionText: string
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windDirection?: string | null
    observedAt: string
  }
  forecast?: {
    high: number
    low: number
  } | null
}

export interface DashboardSystemStatus {
  status: 'healthy' | 'warning' | 'critical'
  sampledAt: string
  instance: {
    id: string
    hostname: string
    platform: string
    arch: string
    release: string
    uptime: number
    virtualization?: string | null
    containerized?: boolean
  }
  cpu: {
    usage: number
    cores: number
    physicalCores?: number | null
    model: string
    speedMHz?: number | null
    temperature?: number | null
    loadAverage: [number, number, number]
    perCore: Array<{
      index: number
      usage: number
      speedMHz?: number | null
      temperature?: number | null
    }>
  }
  memory: {
    total: number
    used: number
    available: number
    free: number
    active?: number | null
    cached?: number | null
    buffers?: number | null
    usage: number
    swap: {
      total: number
      used: number
      free: number
      usage: number
    }
  }
  disks: Array<{
    device: string
    mount: string
    filesystem?: string | null
    type?: string | null
    total: number
    used: number
    available: number
    usage: number
    readPerSecond?: number | null
    writePerSecond?: number | null
    readIops?: number | null
    writeIops?: number | null
  }>
  network: {
    inboundPerSecond: number
    outboundPerSecond: number
    totalReceived?: number | null
    totalSent?: number | null
    interfaces: Array<{
      name: string
      state: 'up' | 'down' | 'unknown'
      type?: string | null
      speedMbps?: number | null
      inboundPerSecond: number
      outboundPerSecond: number
      totalReceived?: number | null
      totalSent?: number | null
    }>
  }
  process: {
    uptime: number
    cpuUsage: number
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
    nodeVersion: string
    activeHandles?: number | null
    activeRequests?: number | null
    eventLoopLag?: number | null
  }
  history: Array<{
    sampledAt: string
    cpuUsage: number
    memoryUsage: number
    inboundPerSecond: number
    outboundPerSecond: number
    diskReadPerSecond?: number | null
    diskWritePerSecond?: number | null
  }>
}

export interface DashboardSystemSocketTicket {
  ticket: string
  expiresAt: string
}

export type DashboardSystemSocketMessage =
  | {
      type: 'system.status'
      sequence: number
      data: DashboardSystemStatus
    }
  | { type: 'ping'; timestamp: number }
  | { type: 'error'; code: string; message: string }

export const getDashboardWeather = () => request<DashboardWeather>('/dashboard/weather')

export const getDashboardSystemStatus = () => request<DashboardSystemStatus>('/dashboard/system')

export const createDashboardSystemSocketTicket = () =>
  request<DashboardSystemSocketTicket>('/dashboard/system/socket-ticket', { method: 'POST' })

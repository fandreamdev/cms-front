import { useEffect, useRef, useState } from 'react'
import {
  createDashboardSystemSocketTicket,
  type DashboardSystemSocketMessage,
  type DashboardSystemStatus,
} from '../../api/dashboard'

export type SystemSocketState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

export const useSystemStatusSocket = (enabled: boolean) => {
  const [data, setData] = useState<DashboardSystemStatus>()
  const [state, setState] = useState<SystemSocketState>(enabled ? 'connecting' : 'idle')
  const [error, setError] = useState<string>()
  const reconnectAttempt = useRef(0)

  useEffect(() => {
    if (!enabled) return

    let disposed = false
    let socket: WebSocket | undefined
    let reconnectTimer: number | undefined

    const scheduleReconnect = () => {
      if (disposed) return
      reconnectAttempt.current += 1
      const delay = Math.min(1000 * 2 ** (reconnectAttempt.current - 1), 15_000)
      setState('reconnecting')
      reconnectTimer = window.setTimeout(connect, delay)
    }

    const connect = async () => {
      if (disposed) return
      setState(reconnectAttempt.current ? 'reconnecting' : 'connecting')
      setError(undefined)

      try {
        const { ticket } = await createDashboardSystemSocketTicket()
        if (disposed) return

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const url = new URL('/api/dashboard/system/stream', `${protocol}//${window.location.host}`)
        url.searchParams.set('ticket', ticket)
        socket = new WebSocket(url)

        socket.onopen = () => {
          reconnectAttempt.current = 0
          setState('connected')
        }
        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(String(event.data)) as DashboardSystemSocketMessage
            if (message.type === 'system.status') {
              setData(message.data)
              setError(undefined)
            } else if (message.type === 'ping' && socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'pong', timestamp: message.timestamp }))
            } else if (message.type === 'error') {
              setError(message.message)
            }
          } catch {
            setError('服务器推送了无法识别的数据')
          }
        }
        socket.onerror = () => setError('实时连接发生错误')
        socket.onclose = (event) => {
          socket = undefined
          if (disposed) return
          if (event.code === 4401 || event.code === 4403) {
            setState('error')
            setError(event.code === 4403 ? '没有服务器监控权限' : '实时连接认证失败')
            return
          }
          scheduleReconnect()
        }
      } catch (connectionError) {
        if (disposed) return
        setError(connectionError instanceof Error ? connectionError.message : '实时连接失败')
        scheduleReconnect()
      }
    }

    void connect()
    return () => {
      disposed = true
      if (reconnectTimer) window.clearTimeout(reconnectTimer)
      socket?.close(1000, 'page closed')
    }
  }, [enabled])

  return { data, state, error }
}

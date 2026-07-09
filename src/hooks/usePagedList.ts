import { useCallback, useEffect, useState } from 'react'

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export function usePagedList<T, Q extends PageQuery>(
  initialQuery: Q,
  request: (query: Q) => Promise<PageResult<T>>,
) {
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<Q>(initialQuery)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await request(query)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [query, request])

  useEffect(() => {
    // 依赖 query 变化拉取列表，属于与外部系统（接口）同步的标准场景
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  return {
    data,
    total,
    loading,
    query,
    setQuery,
    fetchData,
  }
}

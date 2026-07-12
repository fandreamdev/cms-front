import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  total: number
}

export function usePagedQuery<T, Q extends PageQuery>(
  initialQuery: Q,
  request: (query: Q) => Promise<PageResult<T>>,
  queryKey: readonly unknown[],
) {
  const [query, setQuery] = useState<Q>(initialQuery)
  const result = useQuery({
    queryKey: [...queryKey, query],
    queryFn: () => request(query),
    placeholderData: keepPreviousData,
  })

  return {
    data: result.data?.list ?? [],
    total: result.data?.total ?? 0,
    loading: result.isFetching,
    query,
    setQuery,
    refetch: result.refetch,
  }
}

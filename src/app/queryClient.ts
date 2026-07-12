import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status =
          error instanceof Error && 'status' in error
            ? Number((error as Error & { status: number }).status)
            : 0
        return status >= 400 && status < 500 ? false : failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
    mutations: { retry: false },
  },
})

import { useState } from 'react'

export const useDetailModal = <T>(load: (id: number) => Promise<T>) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<T | null>(null)

  const show = async (id: number) => {
    setDetail(null)
    setOpen(true)
    setLoading(true)
    try {
      setDetail(await load(id))
    } catch {
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return { detail, open, loading, show, close: () => setOpen(false) }
}

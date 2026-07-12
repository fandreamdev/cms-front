import { useEffect, useRef, useState } from 'react'

const HEADER_HEIGHT = 55
const PAGINATION_HEIGHT = 64
const MIN_HEIGHT = 120

export function useTableScrollY() {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number>(MIN_HEIGHT)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      const available = element.clientHeight - HEADER_HEIGHT - PAGINATION_HEIGHT
      setScrollY(Math.max(available, MIN_HEIGHT))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, scrollY }
}

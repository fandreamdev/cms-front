import { useEffect, useRef, useState } from 'react'

// 表头高度，用于从容器高度中扣除
const HEADER_HEIGHT = 55
// 分页器高度（含上下外边距）
const PAGINATION_HEIGHT = 64
// 表体最小高度，避免容器过矮时算出负值
const MIN_HEIGHT = 120

/**
 * 让表格填满其所在容器的剩余高度，只在表体内部滚动。
 * 把返回的 ref 挂在一个 flex:1 的容器上（该容器包裹 <Table>），
 * hook 会根据容器实际高度算出 scroll.y。
 */
export function useTableScrollY() {
  const ref = useRef<HTMLDivElement>(null)
  const [scrollY, setScrollY] = useState<number>(MIN_HEIGHT)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const available = el.clientHeight - HEADER_HEIGHT - PAGINATION_HEIGHT
      console.log(available, el.clientHeight)
      setScrollY(Math.max(available, MIN_HEIGHT))
    }

    measure()
    // 容器自身随窗口 / 布局变化时重新测量
    const observer = new ResizeObserver(measure)
    observer.observe(el)

    return () => observer.disconnect()
  }, [])

  return { ref, scrollY }
}

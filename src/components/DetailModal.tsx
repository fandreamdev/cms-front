import { Descriptions, Modal, Skeleton } from 'antd'
import type { ReactNode } from 'react'

interface DetailItem {
  label: ReactNode
  children: ReactNode
}

interface DetailModalProps {
  title: string
  open: boolean
  loading: boolean
  items: DetailItem[]
  onCancel: () => void
}

const DetailModal = ({ title, open, loading, items, onCancel }: DetailModalProps) => (
  <Modal title={title} open={open} onCancel={onCancel} footer={null} destroyOnHidden>
    {loading ? (
      <Skeleton active paragraph={{ rows: 5 }} />
    ) : (
      <Descriptions column={1} bordered items={items} />
    )}
  </Modal>
)

export default DetailModal

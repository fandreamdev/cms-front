import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { AccessType } from '../../api/access'
import { typeColorMap, typeLabelMap } from './constants'
import type { AccessTreeNode } from './types'

interface AccessColumnsOptions {
  onEdit: (record: AccessTreeNode) => void
  onDelete: (id: number) => void
}

export function createAccessColumns({
  onEdit,
  onDelete,
}: AccessColumnsOptions): ColumnsType<AccessTreeNode> {
  return [
    {
      title: '资源名称',
      dataIndex: 'description',
      width: 220,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value: AccessType) => <Tag color={typeColorMap[value]}>{typeLabelMap[value]}</Tag>,
    },
    { title: '资源标识', dataIndex: 'url' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' size='small' onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title='确定删除该资源吗？'
            description={
              record.children?.length ? '该资源包含下级资源，请确认后端是否允许删除。' : undefined
            }
            onConfirm={() => onDelete(record.id)}
            okText='确定'
            cancelText='取消'
          >
            <Button type='link' size='small' danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]
}

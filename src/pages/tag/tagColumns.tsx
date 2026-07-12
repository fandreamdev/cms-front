import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Tag } from '../../api/tag'

interface Options {
  startIndex: number
  onView: (id: number) => void
  onEdit: (record: Tag) => void
  onDelete: (id: number) => void
}

export const createTagColumns = ({
  startIndex,
  onView,
  onEdit,
  onDelete,
}: Options): ColumnsType<Tag> => [
  { title: '序号', key: 'index', width: 70, render: (_, __, index) => startIndex + index + 1 },
  { title: '标签名称', dataIndex: 'name', width: 200 },
  {
    title: '标签描述',
    dataIndex: 'description',
    ellipsis: true,
    render: (value: string | null) => value || '-',
  },
  { title: '排序', dataIndex: 'sort', width: 90 },
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
    width: 200,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button type="link" size="small" onClick={() => onView(record.id)}>
          查看
        </Button>
        <Button type="link" size="small" onClick={() => onEdit(record)}>
          编辑
        </Button>
        <Popconfirm
          title="确定删除该标签吗？"
          onConfirm={() => onDelete(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            删除
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
]

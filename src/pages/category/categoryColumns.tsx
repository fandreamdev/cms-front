import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Category } from '../../api/category'

interface Options {
  onView: (id: number) => void
  onCreateChild: (record: Category) => void
  onEdit: (record: Category) => void
  onDelete: (id: number) => void
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
}

export const createCategoryColumns = ({
  onView,
  onCreateChild,
  onEdit,
  onDelete,
  canView,
  canCreate,
  canEdit,
  canDelete,
}: Options): ColumnsType<Category> => [
  { title: '分类名称', dataIndex: 'name', width: 220 },
  {
    title: '分类描述',
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
    width: 260,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        {canView && (
          <Button type="link" size="small" onClick={() => onView(record.id)}>
            查看
          </Button>
        )}
        {canCreate && (
          <Button type="link" size="small" onClick={() => onCreateChild(record)}>
            新增子分类
          </Button>
        )}
        {canEdit && (
          <Button type="link" size="small" onClick={() => onEdit(record)}>
            编辑
          </Button>
        )}
        {canDelete && (
          <Popconfirm
            title="确定删除该分类吗？"
            description="如果分类正在被文章使用，后端将拒绝删除。"
            onConfirm={() => onDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        )}
      </Space>
    ),
  },
]

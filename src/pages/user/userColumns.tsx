import { Button, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { User } from '../../api/user'

interface UserColumnsOptions {
  onView: (id: number) => void
  onEdit: (record: User) => void
  onDelete: (id: number) => void
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export function createUserColumns({
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}: UserColumnsOptions): ColumnsType<User> {
  return [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username' },
    { title: '手机号', dataIndex: 'mobile', render: (value: string | null) => value || '-' },
    { title: '邮箱', dataIndex: 'email', render: (value: string | null) => value || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (value: number) =>
        value === 1 ? <Tag color="success">启用</Tag> : <Tag color="error">禁用</Tag>,
    },
    {
      title: '超管',
      dataIndex: 'isSuper',
      width: 90,
      render: (value: number) => (value === 1 ? <Tag color="gold">是</Tag> : <Tag>否</Tag>),
    },
    { title: '排序', dataIndex: 'sort', width: 90 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
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
          {canView && (
            <Button type="link" size="small" onClick={() => onView(record.id)}>
              查看
            </Button>
          )}
          {canEdit && (
            <Button type="link" size="small" onClick={() => onEdit(record)}>
              编辑
            </Button>
          )}
          {canDelete && (
            <Popconfirm
              title="确定删除该用户吗？"
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
}

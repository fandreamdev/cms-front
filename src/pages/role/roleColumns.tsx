import { Button, Popconfirm, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Role } from '../../api/role'

interface RoleColumnsOptions {
  onEdit: (record: Role) => void
  onDelete: (id: number) => void
}

export function createRoleColumns({ onEdit, onDelete }: RoleColumnsOptions): ColumnsType<Role> {
  return [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '角色名称', dataIndex: 'name' },
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
            title='确定删除该角色吗？'
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

import { Button, Popconfirm, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { WebsiteSetting } from '../../api/setting'
import { stringifySettingValue } from './settingUtils'

interface Options {
  onView: (key: string) => void
  onEdit: (record: WebsiteSetting) => void
  onDelete: (key: string) => void
  canView: boolean
  canEdit: boolean
  canDelete: boolean
}

export const createSettingColumns = ({
  onView,
  onEdit,
  onDelete,
  canView,
  canEdit,
  canDelete,
}: Options): ColumnsType<WebsiteSetting> => [
  { title: '设置键', dataIndex: 'key', width: 220, fixed: 'left' },
  {
    title: '设置值',
    dataIndex: 'value',
    ellipsis: true,
    render: (value: unknown) => {
      const text = stringifySettingValue(value)
      return (
        <Typography.Text code ellipsis={{ tooltip: text }} style={{ maxWidth: 360 }}>
          {text}
        </Typography.Text>
      )
    },
  },
  {
    title: '公开状态',
    dataIndex: 'isPublic',
    width: 110,
    render: (isPublic: boolean) => (isPublic ? <Tag color="success">公开</Tag> : <Tag>私有</Tag>),
  },
  {
    title: '描述',
    dataIndex: 'description',
    width: 240,
    ellipsis: true,
    render: (value: string | null) => value || '-',
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
        {canView && (
          <Button type="link" size="small" onClick={() => onView(record.key)}>
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
            title="确定删除该设置吗？"
            description={`设置键：${record.key}`}
            onConfirm={() => onDelete(record.key)}
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

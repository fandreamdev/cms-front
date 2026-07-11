import { Button, Image, Popconfirm, Space, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Article } from '../../api/article'
import { resolveAssetUrl } from '../../utils/asset'

interface Options {
  startIndex: number
  onView: (id: number) => void
  onEdit: (record: Article) => void
  onDelete: (id: number) => void
}

export const createArticleColumns = ({ startIndex, onView, onEdit, onDelete }: Options): ColumnsType<Article> => [
  { title: '序号', key: 'index', width: 70, render: (_, __, index) => startIndex + index + 1 },
  { title: '文章标题', dataIndex: 'title', width: 240, ellipsis: true },
  { title: '分类', dataIndex: ['category', 'name'], width: 140, render: (value: string | undefined) => value || '-' },
  { title: '摘要', dataIndex: 'summary', width: 260, ellipsis: true, render: (value: string | null) => value || '-' },
  {
    title: '封面',
    dataIndex: 'coverUrl',
    width: 100,
    render: (value: string | null) => value ? (
      <Image
        src={resolveAssetUrl(value)}
        alt='文章封面'
        width={64}
        height={42}
        style={{ objectFit: 'cover', borderRadius: 4 }}
        preview={{ mask: '查看大图' }}
        fallback='data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2242%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23f5f5f5%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23999%22 font-size=%2210%22%3E加载失败%3C/text%3E%3C/svg%3E'
      />
    ) : '-',
  },
  { title: '状态', dataIndex: 'status', width: 90, render: (value: number) => value === 1 ? <Tag color='success'>已发布</Tag> : <Tag>草稿</Tag> },
  { title: '发布时间', dataIndex: 'publishedAt', width: 190, render: (value: string | null) => value ? new Date(value).toLocaleString() : '-' },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '创建时间', dataIndex: 'createdAt', width: 190, render: (value: string) => new Date(value).toLocaleString() },
  {
    title: '操作', key: 'action', width: 200, fixed: 'right', render: (_, record) => (
      <Space>
        <Button type='link' size='small' onClick={() => onView(record.id)}>查看</Button>
        <Button type='link' size='small' onClick={() => onEdit(record)}>编辑</Button>
        <Popconfirm title='确定删除该文章吗？' onConfirm={() => onDelete(record.id)} okText='确定' cancelText='取消'>
          <Button type='link' size='small' danger>删除</Button>
        </Popconfirm>
      </Space>
    ),
  },
]

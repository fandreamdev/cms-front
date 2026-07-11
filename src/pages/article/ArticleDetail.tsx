import { useEffect, useMemo, useState } from 'react'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { getArticle, type Article } from '../../api/article'
import { renderContent } from '../../utils/content'

const ArticleDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const safeContent = useMemo(() => renderContent(article?.content ?? ''), [article?.content])

  useEffect(() => {
    const articleId = Number(id)
    if (!Number.isInteger(articleId) || articleId <= 0) {
      navigate('/admin/content/articles', { replace: true })
      return
    }
    getArticle(articleId)
      .then(setArticle)
      .catch(() => navigate('/admin/content/articles', { replace: true }))
      .finally(() => setLoading(false))
  }, [id, navigate])

  return <Spin spinning={loading}>
    <Card
      title='文章详情'
      extra={<Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/content/articles')}>返回列表</Button>
        {article && <Button type='primary' icon={<EditOutlined />} onClick={() => navigate(`/admin/content/articles/${article.id}/edit`)}>编辑</Button>}
      </Space>}
    >
      {article && <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Typography.Title level={1} style={{ textAlign: 'center', marginBottom: 12 }}>{article.title}</Typography.Title>
        <Space wrap style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Tag color={article.status === 1 ? 'success' : 'default'}>{article.status === 1 ? '已发布' : '草稿'}</Tag>
          <Tag color='blue'>{article.category?.name || '未分类'}</Tag>
          {article.tags?.map((tag) => <Tag key={tag.id}>{tag.name}</Tag>)}
        </Space>
        {article.summary && <Typography.Paragraph type='secondary' style={{ fontSize: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}>{article.summary}</Typography.Paragraph>}
        <div className='article-content' dangerouslySetInnerHTML={{ __html: safeContent }} />
        <Descriptions
          bordered
          size='small'
          column={{ xs: 1, sm: 2, md: 3 }}
          style={{ marginTop: 40 }}
          items={[
            { label: '发布时间', children: article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '-' },
            { label: '创建时间', children: new Date(article.createdAt).toLocaleString() },
            { label: '更新时间', children: new Date(article.updatedAt).toLocaleString() },
          ]}
        />
      </div>}
    </Card>
  </Spin>
}

export default ArticleDetailPage

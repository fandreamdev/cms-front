import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { Button, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { useNavigate, useParams } from '@tanstack/react-router'
import { getArticle, type Article } from '../../api/article'
import { renderContent } from '../../utils/content'
import { approvalStatusMap } from './approval'
import { queryKeys } from '../../app/queryKeys'
import { useAuth } from '../../contexts/authContextValue'
import { hasPermission } from '../../api/auth'
import { BUTTON_PERMISSIONS } from '../../config/permissions'

interface ArticleDetailPageProps {
  reviewMode?: boolean
}

const ArticleDetailPage = ({ reviewMode = false }: ArticleDetailPageProps) => {
  const { id } = useParams({ strict: false }) as { id?: string }
  const articleId = Number(id)
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    data: article,
    isFetching: loading,
    isError,
  } = useQuery<Article>({
    queryKey: queryKeys.articles.detail(articleId),
    queryFn: () => getArticle(articleId),
    enabled: Number.isInteger(articleId) && articleId > 0,
  })
  const safeContent = useMemo(() => renderContent(article?.content ?? ''), [article?.content])

  useEffect(() => {
    if (!Number.isInteger(articleId) || articleId <= 0) {
      navigate({
        to: reviewMode ? '/admin/reviews/articles' : '/admin/content/articles',
        replace: true,
      })
    }
    if (isError)
      navigate({
        to: reviewMode ? '/admin/reviews/articles' : '/admin/content/articles',
        replace: true,
      })
  }, [articleId, isError, navigate, reviewMode])
  return (
    <Spin spinning={loading}>
      <Card
        title="文章详情"
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() =>
                navigate({ to: reviewMode ? '/admin/reviews/articles' : '/admin/content/articles' })
              }
            >
              返回列表
            </Button>
            {!reviewMode &&
              article &&
              article.status !== 0 &&
              article.approvalStatus !== 'pending' &&
              article.authorId === user?.id &&
              hasPermission(user, BUTTON_PERMISSIONS.article.edit) && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() =>
                    navigate({
                      to: '/admin/content/articles/$id/edit',
                      params: { id: String(article.id) },
                    })
                  }
                >
                  编辑
                </Button>
              )}
          </Space>
        }
      >
        {article && (
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <Typography.Title level={1} style={{ textAlign: 'center', marginBottom: 12 }}>
              {article.title}
            </Typography.Title>
            <Space wrap style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <Tag color={article.status === 1 ? 'success' : 'default'}>
                {article.status === 1 ? '有效' : '失效'}
              </Tag>
              <Tag color={approvalStatusMap[article.approvalStatus].color}>
                {approvalStatusMap[article.approvalStatus].text}
              </Tag>
              <Tag color="blue">{article.category?.name || '未分类'}</Tag>
              {article.tags?.map((tag) => (
                <Tag key={tag.id}>{tag.name}</Tag>
              ))}
            </Space>
            {article.summary && (
              <Typography.Paragraph
                type="secondary"
                style={{ fontSize: 16, padding: 16, background: '#fafafa', borderRadius: 8 }}
              >
                {article.summary}
              </Typography.Paragraph>
            )}
            <div className="article-content" dangerouslySetInnerHTML={{ __html: safeContent }} />
            <Descriptions
              bordered
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              style={{ marginTop: 40 }}
              items={[
                { label: '作者', children: article.author?.username ?? '-' },
                { label: '审核员', children: article.reviewer?.username ?? '-' },
                { label: '拒绝理由', children: article.rejectionReason || '-' },
                {
                  label: '提交时间',
                  children: article.submittedAt
                    ? new Date(article.submittedAt).toLocaleString()
                    : '-',
                },
                {
                  label: '审核时间',
                  children: article.reviewedAt
                    ? new Date(article.reviewedAt).toLocaleString()
                    : '-',
                },
                {
                  label: '发布时间',
                  children: article.publishedAt
                    ? new Date(article.publishedAt).toLocaleString()
                    : '-',
                },
                { label: '创建时间', children: new Date(article.createdAt).toLocaleString() },
                { label: '更新时间', children: new Date(article.updatedAt).toLocaleString() },
              ]}
            />
          </div>
        )}
      </Card>
    </Spin>
  )
}

export default ArticleDetailPage

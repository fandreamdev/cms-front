import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Table, message } from 'antd'
import type { TreeSelectProps } from 'antd'
import { deleteArticle, getArticleList, type Article, type ArticleQuery } from '../../api/article'
import { useNavigate } from '@tanstack/react-router'
import { usePagedQuery } from '../../shared/hooks/usePagedQuery'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import ArticleSearchForm from './ArticleSearchForm'
import { createArticleColumns } from './articleColumns'
import { getCategoryTree, type Category } from '../../api/category'
import { hasPermission } from '../../api/auth'
import { useAuth } from '../../contexts/authContextValue'
import { queryKeys } from '../../app/queryKeys'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import ArticleActions from './ArticleActions'

const articleInitialQuery: ArticleQuery = { page: 1, pageSize: 10 }
const reviewInitialQuery: ArticleQuery = { page: 1, pageSize: 10, approvalStatus: 'pending' }
const toCategoryTreeData = (nodes: Category[]): TreeSelectProps['treeData'] =>
  nodes.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: toCategoryTreeData(item.children ?? []),
  }))

interface ArticleListPageProps {
  reviewMode?: boolean
}

const ArticleListPage = ({ reviewMode = false }: ArticleListPageProps) => {
  const initialQuery = reviewMode ? reviewInitialQuery : articleInitialQuery
  const [searchForm] = Form.useForm<ArticleQuery>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data, total, loading, query, setQuery } = usePagedQuery(
    initialQuery,
    getArticleList,
    queryKeys.articles.all,
  )
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: getCategoryTree,
  })
  const { ref, scrollY } = useTableScrollY()

  const handleDelete = async (id: number) => {
    await deleteArticle(id)
    message.success('删除成功')
    if (data.length === 1 && (query.page ?? 1) > 1)
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    else queryClient.invalidateQueries({ queryKey: queryKeys.articles.all })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <ArticleSearchForm
          form={searchForm}
          categoryTreeData={toCategoryTreeData(categories)}
          showApprovalFilter={!reviewMode}
          onSearch={() =>
            setQuery((prev) => ({
              ...prev,
              ...searchForm.getFieldsValue(),
              ...(reviewMode ? { approvalStatus: 'pending' as const } : {}),
              page: 1,
            }))
          }
          onReset={() => {
            searchForm.resetFields()
            setQuery(initialQuery)
          }}
          onCreate={
            !reviewMode && hasPermission(user, BUTTON_PERMISSIONS.article.create)
              ? () => navigate({ to: '/admin/content/articles/new' })
              : undefined
          }
        />
      </Card>
      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={ref} style={{ height: '100%' }}>
          <Table<Article>
            rowKey="id"
            columns={createArticleColumns({
              startIndex: ((query.page ?? 1) - 1) * (query.pageSize ?? 10),
              onView: (id) =>
                reviewMode
                  ? navigate({ to: '/admin/reviews/articles/$id', params: { id: String(id) } })
                  : navigate({ to: '/admin/content/articles/$id', params: { id: String(id) } }),
              renderActions: (article) => (
                <ArticleActions article={article} reviewMode={reviewMode} onDelete={handleDelete} />
              ),
              canView: hasPermission(user, BUTTON_PERMISSIONS.article.view),
            })}
            dataSource={data}
            loading={loading}
            scroll={{ x: 'max-content', y: scrollY }}
            pagination={{
              current: query.page,
              pageSize: query.pageSize,
              total,
              showSizeChanger: true,
              showTotal: (value) => `共 ${value} 条`,
              onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, pageSize })),
            }}
          />
        </div>
      </Card>
    </div>
  )
}

export default ArticleListPage

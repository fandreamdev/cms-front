import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd'
import type { TreeSelectProps } from 'antd'
import {
  approveArticle,
  deleteArticle,
  getArticleList,
  rejectArticle,
  submitArticle,
  updateArticleStatus,
  withdrawArticle,
  type Article,
  type ArticleQuery,
} from '../../api/article'
import { useNavigate } from '@tanstack/react-router'
import { usePagedQuery } from '../../shared/hooks/usePagedQuery'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import ArticleSearchForm from './ArticleSearchForm'
import { createArticleColumns } from './articleColumns'
import { getCategoryTree, type Category } from '../../api/category'
import { hasPermission } from '../../api/auth'
import { useAuth } from '../../contexts/authContextValue'
import { HttpError } from '../../utils/request'
import { queryKeys } from '../../app/queryKeys'
import { BUTTON_PERMISSIONS } from '../../config/permissions'

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

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    try {
      await action()
      message.success(successMessage)
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all })
    } catch (error) {
      if (error instanceof HttpError && error.status === 409)
        queryClient.invalidateQueries({ queryKey: queryKeys.articles.all })
    }
  }

  const openReject = (record: Article) => {
    let reason = ''
    Modal.confirm({
      title: '拒绝文章',
      content: (
        <Input.TextArea
          maxLength={500}
          showCount
          rows={4}
          placeholder="请输入拒绝理由"
          onChange={(event) => {
            reason = event.target.value
          }}
        />
      ),
      okText: '确认拒绝',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        const normalizedReason = reason.trim()
        if (!normalizedReason) {
          message.error('请输入拒绝理由')
          return Promise.reject()
        }
        await runAction(() => rejectArticle(record.id, normalizedReason), '已拒绝文章')
      },
    })
  }

  const renderActions = (record: Article) => {
    const isAuthor = record.authorId === user?.id
    const editable = isAuthor && ['draft', 'approved', 'rejected'].includes(record.approvalStatus)
    const pending = record.approvalStatus === 'pending'
    const canApprove = hasPermission(user, BUTTON_PERMISSIONS.article.approve)
    const canChangeStatus = hasPermission(user, BUTTON_PERMISSIONS.article.status)
    return (
      <Space>
        {!reviewMode && editable && hasPermission(user, BUTTON_PERMISSIONS.article.edit) && (
          <Button
            type="link"
            size="small"
            onClick={() =>
              navigate({
                to: '/admin/content/articles/$id/edit',
                params: { id: String(record.id) },
              })
            }
          >
            编辑
          </Button>
        )}
        {!reviewMode && editable && hasPermission(user, BUTTON_PERMISSIONS.article.submit) && (
          <Popconfirm
            title="提交后文章将进入审批中，审批完成或撤回前不能继续编辑。"
            onConfirm={() => runAction(() => submitArticle(record.id), '提交审批成功')}
            okText="提交"
            cancelText="取消"
          >
            <Button type="link" size="small">
              提交审批
            </Button>
          </Popconfirm>
        )}
        {!reviewMode &&
          isAuthor &&
          pending &&
          hasPermission(user, BUTTON_PERMISSIONS.article.withdraw) && (
            <Popconfirm
              title="撤回后文章将不能继续编辑或重新提交，是否继续？"
              onConfirm={() => runAction(() => withdrawArticle(record.id), '撤回成功')}
              okText="撤回"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                撤回
              </Button>
            </Popconfirm>
          )}
        {reviewMode && pending && canApprove && (
          <Popconfirm
            title="确定审核通过该文章吗？"
            onConfirm={() => runAction(() => approveArticle(record.id), '审核通过')}
            okText="通过"
            cancelText="取消"
          >
            <Button type="link" size="small">
              通过
            </Button>
          </Popconfirm>
        )}
        {reviewMode && pending && canApprove && (
          <Button type="link" size="small" danger onClick={() => openReject(record)}>
            拒绝
          </Button>
        )}
        {!reviewMode && canChangeStatus && (
          <Button
            type="link"
            size="small"
            onClick={() =>
              runAction(
                () => updateArticleStatus(record.id, record.status === 1 ? 0 : 1),
                record.status === 1 ? '下架成功' : '上架成功',
              )
            }
          >
            {record.status === 1 ? '下架' : '上架'}
          </Button>
        )}
        {!reviewMode &&
          isAuthor &&
          hasPermission(user, BUTTON_PERMISSIONS.article.delete) &&
          ['draft', 'rejected'].includes(record.approvalStatus) && (
            <Popconfirm
              title="确定删除该文章吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          )}
      </Space>
    )
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
              renderActions,
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

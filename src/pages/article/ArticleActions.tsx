import { Button, Input, Modal, Popconfirm, Space, message } from 'antd'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  approveArticle,
  rejectArticle,
  submitArticle,
  updateArticleStatus,
  withdrawArticle,
  type Article,
} from '../../api/article'
import { hasPermission } from '../../api/auth'
import { queryKeys } from '../../app/queryKeys'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { useAuth } from '../../contexts/authContextValue'
import { HttpError } from '../../utils/request'

interface Props {
  article: Article
  reviewMode: boolean
  onDelete: (id: number) => Promise<void>
}

const ArticleActions = ({ article, reviewMode, onDelete }: Props) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isAuthor = article.authorId === user?.id
  const pending = article.approvalStatus === 'pending'
  const editable = isAuthor && !pending && article.status !== 0
  const can = (permission: string) => hasPermission(user, permission)

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

  if (article.status === 0)
    return (
      <Space>
        {!reviewMode && can(BUTTON_PERMISSIONS.article.status) && (
          <Button
            type="link"
            size="small"
            onClick={() => runAction(() => updateArticleStatus(article.id, 1), '上架成功')}
          >
            上架
          </Button>
        )}
      </Space>
    )

  const reject = () => {
    let reason = ''
    Modal.confirm({
      title: '拒绝文章',
      content: (
        <Input.TextArea
          maxLength={500}
          showCount
          rows={4}
          placeholder="请输入拒绝理由"
          onChange={(event) => (reason = event.target.value)}
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
        await runAction(() => rejectArticle(article.id, normalizedReason), '已拒绝文章')
      },
    })
  }

  return (
    <Space>
      {!reviewMode && editable && can(BUTTON_PERMISSIONS.article.edit) && (
        <Button
          type="link"
          size="small"
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
      {!reviewMode && editable && can(BUTTON_PERMISSIONS.article.submit) && (
        <Popconfirm
          title="提交后文章将进入审批中，审批完成或撤回前不能继续编辑。"
          onConfirm={() => runAction(() => submitArticle(article.id), '提交审批成功')}
          okText="提交"
          cancelText="取消"
        >
          <Button type="link" size="small">
            提交审批
          </Button>
        </Popconfirm>
      )}
      {!reviewMode && isAuthor && pending && can(BUTTON_PERMISSIONS.article.withdraw) && (
        <Popconfirm
          title="撤回后文章可重新编辑并再次提交，是否继续？"
          onConfirm={() => runAction(() => withdrawArticle(article.id), '撤回成功')}
          okText="撤回"
          cancelText="取消"
        >
          <Button type="link" size="small" danger>
            撤回
          </Button>
        </Popconfirm>
      )}
      {reviewMode && pending && can(BUTTON_PERMISSIONS.article.approve) && (
        <>
          <Popconfirm
            title="确定审核通过该文章吗？"
            onConfirm={() => runAction(() => approveArticle(article.id), '审核通过')}
            okText="通过"
            cancelText="取消"
          >
            <Button type="link" size="small">
              通过
            </Button>
          </Popconfirm>
          <Button type="link" size="small" danger onClick={reject}>
            拒绝
          </Button>
        </>
      )}
      {!reviewMode && can(BUTTON_PERMISSIONS.article.status) && (
        <Button
          type="link"
          size="small"
          onClick={() =>
            runAction(
              () => updateArticleStatus(article.id, article.status === 1 ? 0 : 1),
              article.status === 1 ? '下架成功' : '上架成功',
            )
          }
        >
          {article.status === 1 ? '下架' : '上架'}
        </Button>
      )}
      {!reviewMode &&
        isAuthor &&
        can(BUTTON_PERMISSIONS.article.delete) &&
        ['draft', 'rejected'].includes(article.approvalStatus) && (
          <Popconfirm
            title="确定删除该文章吗？"
            onConfirm={() => onDelete(article.id)}
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

export default ArticleActions

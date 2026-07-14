import type { Article } from '../../api/article'
import { hasPermission, type CurrentUser } from '../../api/auth'
import { BUTTON_PERMISSIONS } from '../../config/permissions'

export const getArticleCapabilities = (article: Article, user: CurrentUser | null) => {
  const isAuthor = article.authorId === user?.id
  const isOffline = article.status === 0
  const isPending = article.approvalStatus === 'pending'
  const can = (permission: string) => hasPermission(user, permission)

  return {
    isOffline,
    isPending,
    canEdit: isAuthor && !isOffline && !isPending && can(BUTTON_PERMISSIONS.article.edit),
    canSubmit: isAuthor && !isOffline && !isPending && can(BUTTON_PERMISSIONS.article.submit),
    canWithdraw: isAuthor && !isOffline && isPending && can(BUTTON_PERMISSIONS.article.withdraw),
    canReview: !isOffline && isPending && can(BUTTON_PERMISSIONS.article.approve),
    canChangeStatus:
      can(BUTTON_PERMISSIONS.article.status) && (isOffline || (!isOffline && !isPending)),
    canDelete:
      isAuthor &&
      !isOffline &&
      ['draft', 'rejected'].includes(article.approvalStatus) &&
      can(BUTTON_PERMISSIONS.article.delete),
  }
}

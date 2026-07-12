import type { ArticleApprovalStatus } from '../../api/article'

export const approvalStatusMap: Record<ArticleApprovalStatus, { text: string; color: string }> = {
  draft: { text: '草稿', color: 'default' },
  pending: { text: '审批中', color: 'processing' },
  approved: { text: '审核通过', color: 'success' },
  rejected: { text: '审核不通过', color: 'error' },
  withdrawn: { text: '已撤回', color: 'default' },
}

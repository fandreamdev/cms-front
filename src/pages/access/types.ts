import type { AccessPayload, AccessTree } from '../../api/access'

export interface AccessTreeNode extends AccessTree {
  displayNo: number
  children?: AccessTreeNode[]
}

export interface AccessFormValues extends Omit<AccessPayload, 'parentId'> {
  parentId: number
}

import type { Access, AccessQuery, AccessTree, AccessType } from '../../api/access'
import { ROOT_PARENT_VALUE, typeLabelMap } from './constants'
import type { AccessFormValues, AccessTreeNode } from './types'

export function flattenAccessTree(nodes: AccessTree[]): AccessTree[] {
  return nodes.flatMap((node) => [node, ...flattenAccessTree(node.children ?? [])])
}

function getDescendantIds(recordId: number, nodes: AccessTree[]) {
  const ids = new Set<number>()

  const collect = (items: AccessTree[]) => {
    items.forEach((item) => {
      ids.add(item.id)
      collect(item.children ?? [])
    })
  }

  const findAndCollect = (items: AccessTree[]): boolean => {
    for (const item of items) {
      if (item.id === recordId) {
        collect(item.children ?? [])
        return true
      }

      if (findAndCollect(item.children ?? [])) {
        return true
      }
    }

    return false
  }

  findAndCollect(nodes)
  return ids
}

export function buildParentOptions(
  tree: AccessTree[],
  editing: Access | null,
  selectedType?: AccessType,
) {
  const disabledIds = editing
    ? new Set([editing.id, ...getDescendantIds(editing.id, tree)])
    : new Set<number>()
  const options: { label: string; value: number; disabled?: boolean }[] = [
    {
      label: '顶级资源',
      value: ROOT_PARENT_VALUE,
      disabled: selectedType === 'feature',
    },
  ]

  const walk = (nodes: AccessTree[], level: number) => {
    nodes.forEach((node) => {
      const isInvalidFeatureParent = selectedType === 'feature' && node.type !== 'menu'
      options.push({
        label: `${'　'.repeat(level)}${node.description}（${typeLabelMap[node.type]}）`,
        value: node.id,
        disabled: disabledIds.has(node.id) || node.type === 'feature' || isInvalidFeatureParent,
      })

      if (node.children?.length) {
        walk(node.children, level + 1)
      }
    })
  }

  walk(tree, 0)
  return options
}

export function filterAccessTree(nodes: AccessTree[], query: AccessQuery): AccessTree[] {
  const hasQuery = Boolean(query.description?.trim() || query.url?.trim() || query.type)

  if (!hasQuery) {
    return nodes
  }

  return nodes.reduce<AccessTree[]>((result, node) => {
    const children = filterAccessTree(node.children ?? [], query)

    if (isAccessMatched(node, query) || children.length > 0) {
      result.push({
        ...node,
        children,
      })
    }

    return result
  }, [])
}

export function addDisplayNo(nodes: AccessTree[]) {
  let displayNo = 0

  const walk = (items: AccessTree[]): AccessTreeNode[] =>
    items.map((item) => ({
      ...item,
      displayNo: ++displayNo,
      children: item.children?.length ? walk(item.children) : undefined,
    }))

  return walk(nodes)
}

export function toAccessPayload(values: AccessFormValues) {
  return {
    type: values.type,
    url: values.url,
    description: values.description,
    parentId: values.parentId === ROOT_PARENT_VALUE ? null : values.parentId,
  }
}

function isAccessMatched(node: AccessTree, query: AccessQuery) {
  const description = query.description?.trim()
  const url = query.url?.trim()

  return (
    (!description || node.description.includes(description)) &&
    (!query.type || node.type === query.type) &&
    (!url || node.url.includes(url))
  )
}

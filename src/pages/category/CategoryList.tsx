import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Table, message } from 'antd'
import type { TreeSelectProps } from 'antd'
import {
  createCategory,
  deleteCategory,
  getCategory,
  getCategoryTree,
  updateCategory,
  type Category,
  type CategoryPayload,
} from '../../api/category'
import DetailModal from '../../components/DetailModal'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import CategoryFormModal from './CategoryFormModal'
import CategorySearchForm, { type CategorySearchValues } from './CategorySearchForm'
import { createCategoryColumns } from './categoryColumns'
import { queryKeys } from '../../app/queryKeys'
import { usePermission } from '../../shared/hooks/usePermission'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { useDetailModal } from '../../shared/hooks/useDetailModal'

const ROOT_ID = 0
const flatten = (nodes: Category[]): Category[] =>
  nodes.flatMap((item) => [item, ...flatten(item.children ?? [])])
const descendantIds = (record: Category) =>
  new Set([record.id, ...flatten(record.children ?? []).map((item) => item.id)])

const CategoryListPage = () => {
  const [searchForm] = Form.useForm<CategorySearchValues>()
  const queryClient = useQueryClient()
  const can = usePermission()
  const [modalForm] = Form.useForm<CategoryPayload & { parentId: number }>()
  const [query, setQuery] = useState<CategorySearchValues>({})
  const { data: tree = [], isFetching: loading } = useQuery({
    queryKey: queryKeys.categories.tree,
    queryFn: getCategoryTree,
  })
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const { ref, scrollY } = useTableScrollY()
  const flatData = useMemo(() => flatten(tree), [tree])
  const detailModal = useDetailModal((id) =>
    queryClient.fetchQuery({
      queryKey: queryKeys.categories.detail(id),
      queryFn: () => getCategory(id),
    }),
  )

  const filteredTree = useMemo(() => {
    const filter = (nodes: Category[]): Category[] =>
      nodes.reduce<Category[]>((result, item) => {
        const children = filter(item.children ?? [])
        const matched =
          (!query.name?.trim() || item.name.includes(query.name.trim())) &&
          (!query.description?.trim() || item.description === query.description.trim())
        if (matched || children.length)
          result.push({ ...item, children: children.length ? children : undefined })
        return result
      }, [])
    return filter(tree)
  }, [tree, query])

  const parentTreeData = useMemo<TreeSelectProps['treeData']>(() => {
    const disabled = editing ? descendantIds(editing) : new Set<number>()
    const map = (nodes: Category[]): NonNullable<TreeSelectProps['treeData']> =>
      nodes.map((item) => ({
        title: item.name,
        value: item.id,
        key: item.id,
        disabled: disabled.has(item.id),
        children: map(item.children ?? []),
      }))
    return [{ title: '顶级分类', value: ROOT_ID, key: ROOT_ID }, ...map(tree)]
  }, [tree, editing])

  const openCreate = (parentId = ROOT_ID) => {
    setEditing(null)
    modalForm.resetFields()
    modalForm.setFieldsValue({ parentId, sort: 100 })
    setModalOpen(true)
  }
  const openEdit = (record: Category) => {
    setEditing(record)
    modalForm.setFieldsValue({
      name: record.name,
      description: record.description,
      sort: record.sort,
      parentId: record.parentId ?? ROOT_ID,
    })
    setModalOpen(true)
  }
  const handleSubmit = async () => {
    const values = await modalForm.validateFields()
    const payload = {
      ...values,
      description: values.description || null,
      parentId: values.parentId === ROOT_ID ? null : values.parentId,
    }
    setSubmitting(true)
    try {
      if (editing) await updateCategory(editing.id, payload)
      else await createCategory(payload)
      message.success(editing ? '更新成功' : '新增成功')
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
    } finally {
      setSubmitting(false)
    }
  }
  const handleDelete = async (id: number) => {
    await deleteCategory(id)
    message.success('删除成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.categories.all })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <CategorySearchForm
          form={searchForm}
          onSearch={() => setQuery(searchForm.getFieldsValue())}
          onReset={() => {
            searchForm.resetFields()
            setQuery({})
          }}
          onCreate={can(BUTTON_PERMISSIONS.category.create) ? () => openCreate() : undefined}
        />
      </Card>
      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={ref} style={{ height: '100%' }}>
          <Table<Category>
            rowKey="id"
            columns={createCategoryColumns({
              onView: detailModal.show,
              onCreateChild: (record) => openCreate(record.id),
              onEdit: openEdit,
              onDelete: handleDelete,
              canView: can(BUTTON_PERMISSIONS.category.view),
              canCreate: can(BUTTON_PERMISSIONS.category.create),
              canEdit: can(BUTTON_PERMISSIONS.category.edit),
              canDelete: can(BUTTON_PERMISSIONS.category.delete),
            })}
            dataSource={filteredTree}
            loading={loading}
            pagination={false}
            expandable={{ defaultExpandAllRows: true }}
            scroll={{ x: 'max-content', y: scrollY }}
            footer={() => `共 ${flatten(filteredTree).length} 条`}
          />
        </div>
      </Card>
      <CategoryFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        parentTreeData={parentTreeData}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="分类详情"
        open={detailModal.open}
        loading={detailModal.loading}
        onCancel={detailModal.close}
        items={
          detailModal.detail
            ? [
                { label: 'ID', children: detailModal.detail.id },
                { label: '分类名称', children: detailModal.detail.name },
                { label: '分类描述', children: detailModal.detail.description || '-' },
                {
                  label: '上级分类',
                  children:
                    detailModal.detail.parentId === null
                      ? '-'
                      : flatData.find((item) => item.id === detailModal.detail!.parentId)?.name ||
                        '-',
                },
                { label: '排序', children: detailModal.detail.sort },
                {
                  label: '创建时间',
                  children: new Date(detailModal.detail.createdAt).toLocaleString(),
                },
                {
                  label: '更新时间',
                  children: new Date(detailModal.detail.updatedAt).toLocaleString(),
                },
              ]
            : []
        }
      />
    </div>
  )
}

export default CategoryListPage

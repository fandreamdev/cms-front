import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, Form, Table, message } from 'antd'
import {
  createAccess,
  deleteAccess,
  getAccess,
  getAccessTree,
  updateAccess,
  type Access,
  type AccessQuery,
} from '../../api/access'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import DetailModal from '../../components/DetailModal'
import AccessFormModal from './AccessFormModal'
import AccessSearchForm from './AccessSearchForm'
import { createAccessColumns } from './accessColumns'
import { ROOT_PARENT_VALUE } from './constants'
import { typeLabelMap } from './constants'
import {
  addDisplayNo,
  buildParentOptions,
  filterAccessTree,
  flattenAccessTree,
  toAccessPayload,
} from './treeUtils'
import type { AccessFormValues, AccessTreeNode } from './types'
import { queryKeys } from '../../app/queryKeys'
import { usePermission } from '../../shared/hooks/usePermission'
import { BUTTON_PERMISSIONS } from '../../config/permissions'

const AccessListPage = () => {
  const [searchForm] = Form.useForm<AccessQuery>()
  const queryClient = useQueryClient()
  const can = usePermission()
  const [modalForm] = Form.useForm<AccessFormValues>()
  const selectedType = Form.useWatch('type', modalForm)

  const [query, setQuery] = useState<AccessQuery>({})
  const { data: tree = [], isFetching: loading } = useQuery({
    queryKey: queryKeys.accesses.tree,
    queryFn: getAccessTree,
  })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Access | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<Access | null>(null)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()

  const flatData = useMemo(() => flattenAccessTree(tree), [tree])
  const filteredTree = useMemo(() => filterAccessTree(tree, query), [tree, query])
  const treeData = useMemo(() => addDisplayNo(filteredTree), [filteredTree])
  const total = useMemo(() => flattenAccessTree(filteredTree).length, [filteredTree])
  const parentOptions = useMemo(
    () => buildParentOptions(tree, editing, selectedType),
    [tree, editing, selectedType],
  )

  const handleSearch = () => {
    setQuery(searchForm.getFieldsValue())
  }

  const handleReset = () => {
    searchForm.resetFields()
    setQuery({})
  }

  const openCreate = () => {
    setEditing(null)
    modalForm.resetFields()
    modalForm.setFieldsValue({
      type: 'menu',
      parentId: ROOT_PARENT_VALUE,
    })
    setModalOpen(true)
  }

  const openEdit = (record: AccessTreeNode) => {
    setEditing(record)
    modalForm.setFieldsValue({
      type: record.type,
      url: record.url,
      description: record.description,
      parentId: record.parentId ?? ROOT_PARENT_VALUE,
    })
    setModalOpen(true)
  }

  const openDetail = async (id: number) => {
    setDetail(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      setDetail(
        await queryClient.fetchQuery({
          queryKey: queryKeys.accesses.detail(id),
          queryFn: () => getAccess(id),
        }),
      )
    } catch {
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmit = async () => {
    const values = await modalForm.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateAccess(editing.id, toAccessPayload(values))
        message.success('更新成功')
      } else {
        await createAccess(toAccessPayload(values))
        message.success('新增成功')
      }
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.accesses.all })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteAccess(id)
    message.success('删除成功')
    queryClient.invalidateQueries({ queryKey: queryKeys.accesses.all })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <AccessSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={can(BUTTON_PERMISSIONS.access.create) ? openCreate : undefined}
        />
      </Card>

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<AccessTreeNode>
            rowKey="id"
            columns={createAccessColumns({
              onView: openDetail,
              onEdit: openEdit,
              onDelete: handleDelete,
              canView: can(BUTTON_PERMISSIONS.access.view),
              canEdit: can(BUTTON_PERMISSIONS.access.edit),
              canDelete: can(BUTTON_PERMISSIONS.access.delete),
            })}
            dataSource={treeData}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content', y: scrollY }}
            expandable={{ defaultExpandAllRows: true }}
            footer={() => `共 ${total} 条`}
            indentSize={12}
          />
        </div>
      </Card>

      <AccessFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        selectedType={selectedType}
        flatData={flatData}
        parentOptions={parentOptions}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="资源详情"
        open={detailOpen}
        loading={detailLoading}
        onCancel={() => setDetailOpen(false)}
        items={
          detail
            ? [
                { label: 'ID', children: detail.id },
                { label: '资源名称', children: detail.description },
                { label: '类型', children: typeLabelMap[detail.type] },
                { label: '资源标识', children: detail.url },
                {
                  label: '上级资源名称',
                  children:
                    detail.parentId === null
                      ? '-'
                      : (flatData.find((item) => item.id === detail.parentId)?.description ?? '-'),
                },
                { label: '创建时间', children: new Date(detail.createdAt).toLocaleString() },
                { label: '更新时间', children: new Date(detail.updatedAt).toLocaleString() },
              ]
            : []
        }
      />
    </div>
  )
}

export default AccessListPage

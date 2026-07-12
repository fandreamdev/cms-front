import { useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import type { TreeSelectProps } from 'antd'
import {
  createRole,
  deleteRole,
  getRole,
  getRoleList,
  updateRole,
  type Role,
  type RolePayload,
  type RoleQuery,
} from '../../api/role'
import { usePagedQuery } from '../../shared/hooks/usePagedQuery'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import DetailModal from '../../components/DetailModal'
import RoleFormModal from './RoleFormModal'
import RoleSearchForm from './RoleSearchForm'
import { createRoleColumns } from './roleColumns'
import { getAccessTree, type AccessTree } from '../../api/access'
import { typeLabelMap } from '../access/constants'
import { queryKeys } from '../../app/queryKeys'
import { useQueryClient } from '@tanstack/react-query'
import { usePermission } from '../../shared/hooks/usePermission'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { useDetailModal } from '../../shared/hooks/useDetailModal'

const initialQuery: RoleQuery = { page: 1, pageSize: 10 }

const toAccessTreeData = (nodes: AccessTree[]): TreeSelectProps['treeData'] =>
  nodes.map((access) => ({
    title: `${access.description}（${typeLabelMap[access.type]}）`,
    value: access.id,
    key: access.id,
    children: toAccessTreeData(access.children ?? []),
  }))

const RoleListPage = () => {
  const [searchForm] = Form.useForm<RoleQuery>()
  const queryClient = useQueryClient()
  const can = usePermission()
  const [modalForm] = Form.useForm<RolePayload>()

  const { data, total, loading, query, setQuery } = usePagedQuery(
    initialQuery,
    getRoleList,
    queryKeys.roles.all,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [accessTree, setAccessTree] = useState<AccessTree[]>([])
  const [accessLoading, setAccessLoading] = useState(false)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()
  const detailModal = useDetailModal((id) =>
    queryClient.fetchQuery({ queryKey: queryKeys.roles.detail(id), queryFn: () => getRole(id) }),
  )

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setQuery((prev) => ({ ...prev, ...values, page: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setQuery(initialQuery)
  }

  const openCreate = async () => {
    setEditing(null)
    setAccessTree([])
    modalForm.resetFields()
    modalForm.setFieldsValue({ accessIds: [] })
    setModalOpen(true)
    setAccessLoading(true)
    try {
      setAccessTree(
        await queryClient.fetchQuery({ queryKey: queryKeys.accesses.tree, queryFn: getAccessTree }),
      )
    } catch {
      setModalOpen(false)
    } finally {
      setAccessLoading(false)
    }
  }

  const openEdit = async (record: Role) => {
    setEditing(record)
    setAccessTree([])
    modalForm.setFieldsValue({ name: record.name, accessIds: [] })
    setModalOpen(true)
    setAccessLoading(true)
    try {
      const [role, tree] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.roles.detail(record.id),
          queryFn: () => getRole(record.id),
        }),
        queryClient.fetchQuery({ queryKey: queryKeys.accesses.tree, queryFn: getAccessTree }),
      ])
      setEditing(role)
      setAccessTree(tree)
      modalForm.setFieldsValue({
        name: role.name,
        accessIds: role.accesses?.map((access) => access.id) ?? [],
      })
    } catch {
      setModalOpen(false)
    } finally {
      setAccessLoading(false)
    }
  }

  const handleSubmit = async () => {
    const values = await modalForm.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateRole(editing.id, values)
        message.success('更新成功')
      } else {
        await createRole(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteRole(id)
    message.success('删除成功')
    if (data.length === 1 && (query.page ?? 1) > 1) {
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.all })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <RoleSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={can(BUTTON_PERMISSIONS.role.create) ? openCreate : undefined}
          canSearch={can(BUTTON_PERMISSIONS.role.list)}
        />
      </Card>

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<Role>
            rowKey="id"
            columns={createRoleColumns({
              onView: detailModal.show,
              onEdit: openEdit,
              onDelete: handleDelete,
              canView: can(BUTTON_PERMISSIONS.role.view),
              canEdit: can(BUTTON_PERMISSIONS.role.edit),
              canDelete: can(BUTTON_PERMISSIONS.role.delete),
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

      <RoleFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        accessLoading={accessLoading}
        accessTreeData={toAccessTreeData(accessTree)}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="角色详情"
        open={detailModal.open}
        loading={detailModal.loading}
        onCancel={detailModal.close}
        items={
          detailModal.detail
            ? [
                { label: 'ID', children: detailModal.detail.id },
                { label: '角色名称', children: detailModal.detail.name },
                {
                  label: '资源',
                  children:
                    detailModal.detail.accesses?.map((access) => access.description).join('、') ||
                    '-',
                },
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

export default RoleListPage

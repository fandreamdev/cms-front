import { useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import {
  createUser,
  deleteUser,
  getUser,
  getUserList,
  updateUser,
  type User,
  type UserPayload,
  type UserQuery,
} from '../../api/user'
import { usePagedQuery } from '../../shared/hooks/usePagedQuery'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import DetailModal from '../../components/DetailModal'
import UserFormModal from './UserFormModal'
import UserSearchForm from './UserSearchForm'
import { createUserColumns } from './userColumns'
import { queryKeys } from '../../app/queryKeys'
import { getRoleList, type Role } from '../../api/role'
import { useQueryClient } from '@tanstack/react-query'
import { usePermission } from '../../shared/hooks/usePermission'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import { useDetailModal } from '../../shared/hooks/useDetailModal'

const initialQuery: UserQuery = { page: 1, pageSize: 10 }

const UserListPage = () => {
  const [searchForm] = Form.useForm<UserQuery>()
  const queryClient = useQueryClient()
  const can = usePermission()
  const [modalForm] = Form.useForm<UserPayload>()

  const { data, total, loading, query, setQuery } = usePagedQuery(
    initialQuery,
    getUserList,
    queryKeys.users.all,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  const [roleLoading, setRoleLoading] = useState(false)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()
  const detailModal = useDetailModal((id) =>
    queryClient.fetchQuery({ queryKey: queryKeys.users.detail(id), queryFn: () => getUser(id) }),
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
    setRoles([])
    modalForm.resetFields()
    modalForm.setFieldsValue({ status: 1, isSuper: 0, sort: 100, roleIds: [] })
    setModalOpen(true)
    setRoleLoading(true)
    try {
      const roleResult = await queryClient.fetchQuery({
        queryKey: queryKeys.roles.list({ page: 1, pageSize: 1000 }),
        queryFn: () => getRoleList({ page: 1, pageSize: 1000 }),
      })
      setRoles(roleResult.list)
    } catch {
      setModalOpen(false)
    } finally {
      setRoleLoading(false)
    }
  }

  const openEdit = async (record: User) => {
    setEditing(record)
    setRoles([])
    modalForm.setFieldsValue({
      username: record.username,
      mobile: record.mobile,
      email: record.email,
      status: record.status,
      isSuper: record.isSuper,
      sort: record.sort,
      roleIds: [],
    })
    setModalOpen(true)
    setRoleLoading(true)
    try {
      const [user, roleResult] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: queryKeys.users.detail(record.id),
          queryFn: () => getUser(record.id),
        }),
        queryClient.fetchQuery({
          queryKey: queryKeys.roles.list({ page: 1, pageSize: 1000 }),
          queryFn: () => getRoleList({ page: 1, pageSize: 1000 }),
        }),
      ])
      setEditing(user)
      setRoles(roleResult.list)
      modalForm.setFieldsValue({
        username: user.username,
        mobile: user.mobile,
        email: user.email,
        status: user.status,
        isSuper: user.isSuper,
        sort: user.sort,
        roleIds: user.roles?.map((role) => role.id) ?? [],
      })
    } catch {
      setModalOpen(false)
    } finally {
      setRoleLoading(false)
    }
  }

  const handleSubmit = async () => {
    const values = await modalForm.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateUser(editing.id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteUser(id)
    message.success('删除成功')
    if (data.length === 1 && (query.page ?? 1) > 1) {
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <Card>
        <UserSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={can(BUTTON_PERMISSIONS.user.create) ? openCreate : undefined}
          canSearch={can(BUTTON_PERMISSIONS.user.list)}
        />
      </Card>

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<User>
            rowKey="id"
            columns={createUserColumns({
              onView: detailModal.show,
              onEdit: openEdit,
              onDelete: handleDelete,
              canView: can(BUTTON_PERMISSIONS.user.view),
              canEdit: can(BUTTON_PERMISSIONS.user.edit),
              canDelete: can(BUTTON_PERMISSIONS.user.delete),
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

      <UserFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        roleLoading={roleLoading}
        roleOptions={roles.map((role) => ({ label: role.name, value: role.id }))}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="用户详情"
        open={detailModal.open}
        loading={detailModal.loading}
        onCancel={detailModal.close}
        items={
          detailModal.detail
            ? [
                { label: 'ID', children: detailModal.detail.id },
                { label: '用户名', children: detailModal.detail.username },
                { label: '手机号', children: detailModal.detail.mobile || '-' },
                { label: '邮箱', children: detailModal.detail.email || '-' },
                { label: '状态', children: detailModal.detail.status === 1 ? '启用' : '禁用' },
                { label: '是否超管', children: detailModal.detail.isSuper === 1 ? '是' : '否' },
                { label: '排序', children: detailModal.detail.sort },
                {
                  label: '角色',
                  children: detailModal.detail.roles?.map((role) => role.name).join('、') || '-',
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

export default UserListPage

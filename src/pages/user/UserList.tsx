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
import { usePagedList } from '../../hooks/usePagedList'
import { useTableScrollY } from '../../hooks/useTableScrollY'
import DetailModal from '../../components/DetailModal'
import UserFormModal from './UserFormModal'
import UserSearchForm from './UserSearchForm'
import { createUserColumns } from './userColumns'
import { getRoleList, type Role } from '../../api/role'

const initialQuery: UserQuery = { page: 1, pageSize: 10 }

const UserListPage = () => {
  const [searchForm] = Form.useForm<UserQuery>()
  const [modalForm] = Form.useForm<UserPayload>()

  const { data, total, loading, query, setQuery, fetchData } = usePagedList(
    initialQuery,
    getUserList,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<User | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [roleLoading, setRoleLoading] = useState(false)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()

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
      const roleResult = await getRoleList({ page: 1, pageSize: 1000 })
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
        getUser(record.id),
        getRoleList({ page: 1, pageSize: 1000 }),
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

  const openDetail = async (id: number) => {
    setDetail(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      setDetail(await getUser(id))
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
        await updateUser(editing.id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      fetchData()
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
      fetchData()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%' }}>
      <Card>
        <UserSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={openCreate}
        />
      </Card>

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<User>
            rowKey='id'
            columns={createUserColumns({ onView: openDetail, onEdit: openEdit, onDelete: handleDelete })}
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
        title='用户详情'
        open={detailOpen}
        loading={detailLoading}
        onCancel={() => setDetailOpen(false)}
        items={detail ? [
          { label: 'ID', children: detail.id },
          { label: '用户名', children: detail.username },
          { label: '手机号', children: detail.mobile || '-' },
          { label: '邮箱', children: detail.email || '-' },
          { label: '状态', children: detail.status === 1 ? '启用' : '禁用' },
          { label: '是否超管', children: detail.isSuper === 1 ? '是' : '否' },
          { label: '排序', children: detail.sort },
          { label: '角色', children: detail.roles?.map((role) => role.name).join('、') || '-' },
          { label: '创建时间', children: new Date(detail.createdAt).toLocaleString() },
          { label: '更新时间', children: new Date(detail.updatedAt).toLocaleString() },
        ] : []}
      />
    </div>
  )
}

export default UserListPage

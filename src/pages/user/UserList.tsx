import { useState } from 'react'
import { Button, Card, Form, Table, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import {
  createUser,
  deleteUser,
  getUserList,
  updateUser,
  type User,
  type UserPayload,
  type UserQuery,
} from '../../api/user'
import { usePagedList } from '../../hooks/usePagedList'
import UserFormModal from './UserFormModal'
import UserSearchForm from './UserSearchForm'
import { createUserColumns } from './userColumns'

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

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setQuery((prev) => ({ ...prev, ...values, page: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setQuery(initialQuery)
  }

  const openCreate = () => {
    setEditing(null)
    modalForm.resetFields()
    modalForm.setFieldsValue({ status: 1, isSuper: 0, sort: 100 })
    setModalOpen(true)
  }

  const openEdit = (record: User) => {
    setEditing(record)
    modalForm.setFieldsValue({
      username: record.username,
      mobile: record.mobile,
      email: record.email,
      status: record.status,
      isSuper: record.isSuper,
      sort: record.sort,
    })
    setModalOpen(true)
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <UserSearchForm form={searchForm} onSearch={handleSearch} onReset={handleReset} />
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
            新增用户
          </Button>
        </div>
        <Table<User>
          rowKey='id'
          columns={createUserColumns({ onEdit: openEdit, onDelete: handleDelete })}
          dataSource={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <UserFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}

export default UserListPage

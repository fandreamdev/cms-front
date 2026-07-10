import { useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import {
  createRole,
  deleteRole,
  getRoleList,
  updateRole,
  type Role,
  type RolePayload,
  type RoleQuery,
} from '../../api/role'
import { usePagedList } from '../../hooks/usePagedList'
import { useTableScrollY } from '../../hooks/useTableScrollY'
import RoleFormModal from './RoleFormModal'
import RoleSearchForm from './RoleSearchForm'
import { createRoleColumns } from './roleColumns'

const initialQuery: RoleQuery = { page: 1, pageSize: 10 }

const RoleListPage = () => {
  const [searchForm] = Form.useForm<RoleQuery>()
  const [modalForm] = Form.useForm<RolePayload>()

  const { data, total, loading, query, setQuery, fetchData } = usePagedList(
    initialQuery,
    getRoleList,
  )

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()

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
    setModalOpen(true)
  }

  const openEdit = (record: Role) => {
    setEditing(record)
    modalForm.setFieldsValue({ name: record.name })
    setModalOpen(true)
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
      fetchData()
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
      fetchData()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, minHeight: 0 }}>
      <Card>
        <RoleSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={openCreate}
        />
      </Card>

      <Card
        style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, minHeight: 0, overflow: 'hidden' } }}
      >
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<Role>
            rowKey='id'
            columns={createRoleColumns({ onEdit: openEdit, onDelete: handleDelete })}
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
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  )
}

export default RoleListPage

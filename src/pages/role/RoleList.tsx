import { useCallback, useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined } from '@ant-design/icons'
import {
  createRole,
  deleteRole,
  getRoleList,
  updateRole,
  type Role,
  type RolePayload,
  type RoleQuery,
} from '../../api/role'

const RoleListPage = () => {
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm<RolePayload>()

  const [data, setData] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<RoleQuery>({ page: 1, pageSize: 10 })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getRoleList(query)
      setData(res.list)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    // 依赖 query 变化拉取列表，属于与外部系统（接口）同步的标准场景
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setQuery((prev) => ({ ...prev, ...values, page: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setQuery({ page: 1, pageSize: 10 })
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
    // 删除最后一页最后一条时回退一页
    if (data.length === 1 && (query.page ?? 1) > 1) {
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    } else {
      fetchData()
    }
  }

  const columns: ColumnsType<Role> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '角色名称', dataIndex: 'name' },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      width: 190,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type='link' size='small' onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title='确定删除该角色吗？'
            onConfirm={() => handleDelete(record.id)}
            okText='确定'
            cancelText='取消'
          >
            <Button type='link' size='small' danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <Form form={searchForm} layout='inline' onFinish={handleSearch}>
          <Form.Item name='name' label='角色名称'>
            <Input placeholder='请输入角色名称' allowClear />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type='primary' htmlType='submit'>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Button type='primary' icon={<PlusOutlined />} onClick={openCreate}>
            新增角色
          </Button>
        </div>
        <Table<Role>
          rowKey='id'
          columns={columns}
          dataSource={data}
          loading={loading}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: query.page,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showTotal: (value) => `共 ${value} 条`,
            onChange: (page, pageSize) =>
              setQuery((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑角色' : '新增角色'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText='确定'
        cancelText='取消'
        destroyOnHidden
      >
        <Form form={modalForm} layout='vertical'>
          <Form.Item
            name='name'
            label='角色名称'
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder='请输入角色名称' allowClear />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RoleListPage

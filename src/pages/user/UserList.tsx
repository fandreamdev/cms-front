import { useCallback, useEffect, useState } from 'react'
import {
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
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

const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 },
]

const superOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 },
]

const UserListPage = () => {
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm<UserPayload>()

  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<UserQuery>({ page: 1, pageSize: 10 })

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUserList(query)
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
    // 删除最后一页最后一条时回退一页
    if (data.length === 1 && (query.page ?? 1) > 1) {
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    } else {
      fetchData()
    }
  }

  const columns: ColumnsType<User> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username' },
    { title: '手机号', dataIndex: 'mobile', render: (v: string | null) => v || '-' },
    { title: '邮箱', dataIndex: 'email', render: (v: string | null) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v: number) =>
        v === 1 ? <Tag color='success'>启用</Tag> : <Tag color='error'>禁用</Tag>,
    },
    {
      title: '超管',
      dataIndex: 'isSuper',
      width: 90,
      render: (v: number) => (v === 1 ? <Tag color='gold'>是</Tag> : <Tag>否</Tag>),
    },
    { title: '排序', dataIndex: 'sort', width: 90 },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 190,
      render: (v: string) => new Date(v).toLocaleString(),
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
            title='确定删除该用户吗？'
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
          <Form.Item name='username' label='用户名'>
            <Input placeholder='请输入用户名' allowClear />
          </Form.Item>
          <Form.Item name='mobile' label='手机号'>
            <Input placeholder='请输入手机号' allowClear />
          </Form.Item>
          <Form.Item name='email' label='邮箱'>
            <Input placeholder='请输入邮箱' allowClear />
          </Form.Item>
          <Form.Item name='status' label='状态'>
            <Select
              placeholder='全部'
              allowClear
              options={statusOptions}
              style={{ width: 120 }}
            />
          </Form.Item>
          <Form.Item name='isSuper' label='超管'>
            <Select
              placeholder='全部'
              allowClear
              options={superOptions}
              style={{ width: 120 }}
            />
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
            新增用户
          </Button>
        </div>
        <Table<User>
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
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) =>
              setQuery((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editing ? '编辑用户' : '新增用户'}
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
            name='username'
            label='用户名'
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder='请输入用户名' />
          </Form.Item>
          <Form.Item
            name='password'
            label='密码'
            rules={editing ? [] : [{ required: true, message: '请输入密码' }]}
            extra={editing ? '不填写则不修改密码' : undefined}
          >
            <Input.Password placeholder='请输入密码' autoComplete='new-password' />
          </Form.Item>
          <Form.Item
            name='mobile'
            label='手机号'
            rules={[{ pattern: /^1\d{10}$/, message: '手机号格式不正确' }]}
          >
            <Input placeholder='请输入手机号' allowClear />
          </Form.Item>
          <Form.Item
            name='email'
            label='邮箱'
            rules={[{ type: 'email', message: '邮箱格式不正确' }]}
          >
            <Input placeholder='请输入邮箱' allowClear />
          </Form.Item>
          <Form.Item name='status' label='状态' rules={[{ required: true }]}>
            <Select options={statusOptions} />
          </Form.Item>
          <Form.Item name='isSuper' label='是否超管' rules={[{ required: true }]}>
            <Select options={superOptions} />
          </Form.Item>
          <Form.Item name='sort' label='排序' rules={[{ required: true }]}>
            <Input type='number' placeholder='数值越大越靠前' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserListPage

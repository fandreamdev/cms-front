import { useCallback, useEffect, useMemo, useState } from 'react'
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
  createAccess,
  deleteAccess,
  getAccessTree,
  updateAccess,
  type Access,
  type AccessPayload,
  type AccessQuery,
  type AccessTree,
  type AccessType,
} from '../../api/access'

const ROOT_PARENT_VALUE = 0

const typeOptions: { label: string; value: AccessType }[] = [
  { label: '模块', value: 'module' },
  { label: '菜单', value: 'menu' },
  { label: '功能', value: 'feature' },
]

const typeLabelMap: Record<AccessType, string> = {
  module: '模块',
  menu: '菜单',
  feature: '功能',
}

const typeColorMap: Record<AccessType, string> = {
  module: 'blue',
  menu: 'green',
  feature: 'gold',
}

interface AccessTreeNode extends AccessTree {
  displayNo: number
  children?: AccessTreeNode[]
}

interface AccessFormValues extends Omit<AccessPayload, 'parentId'> {
  parentId: number
}

function flattenAccessTree(nodes: AccessTree[]): AccessTree[] {
  return nodes.flatMap((node) => [node, ...flattenAccessTree(node.children ?? [])])
}

function getDescendantIds(recordId: number, nodes: AccessTree[]) {
  const ids = new Set<number>()

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

  const collect = (items: AccessTree[]) => {
    items.forEach((item) => {
      ids.add(item.id)
      collect(item.children ?? [])
    })
  }

  findAndCollect(nodes)
  return ids
}

function buildParentOptions(tree: AccessTree[], editing: Access | null, selectedType?: AccessType) {
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

function isAccessMatched(node: AccessTree, query: AccessQuery) {
  const description = query.description?.trim()
  const url = query.url?.trim()

  return (
    (!description || node.description.includes(description)) &&
    (!query.type || node.type === query.type) &&
    (!url || node.url.includes(url))
  )
}

function filterAccessTree(nodes: AccessTree[], query: AccessQuery): AccessTree[] {
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

function addDisplayNo(nodes: AccessTree[]) {
  let displayNo = 0

  const walk = (items: AccessTree[]): AccessTreeNode[] =>
    items.map((item) => ({
      ...item,
      displayNo: ++displayNo,
      children: item.children?.length ? walk(item.children) : undefined,
    }))

  return walk(nodes)
}

function toPayload(values: AccessFormValues): AccessPayload {
  return {
    type: values.type,
    url: values.url,
    description: values.description,
    parentId: values.parentId === ROOT_PARENT_VALUE ? null : values.parentId,
  }
}

const AccessListPage = () => {
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm<AccessFormValues>()
  const selectedType = Form.useWatch('type', modalForm)

  const [tree, setTree] = useState<AccessTree[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<AccessQuery>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Access | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const flatData = useMemo(() => flattenAccessTree(tree), [tree])
  const filteredTree = useMemo(() => filterAccessTree(tree, query), [tree, query])
  const treeData = useMemo(() => addDisplayNo(filteredTree), [filteredTree])
  const total = useMemo(() => flattenAccessTree(filteredTree).length, [filteredTree])
  const parentOptions = useMemo(
    () => buildParentOptions(tree, editing, selectedType),
    [tree, editing, selectedType],
  )

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAccessTree()
      setTree(res)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // 依赖接口树同步资源列表
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setQuery(values)
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

  const handleSubmit = async () => {
    const values = await modalForm.validateFields()
    setSubmitting(true)
    try {
      if (editing) {
        await updateAccess(editing.id, toPayload(values))
        message.success('更新成功')
      } else {
        await createAccess(toPayload(values))
        message.success('新增成功')
      }
      setModalOpen(false)
      fetchData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteAccess(id)
    message.success('删除成功')
    fetchData()
  }

  const columns: ColumnsType<AccessTreeNode> = [
    {
      title: '序号',
      dataIndex: 'displayNo',
      width: 80,
      render: (value: number) => <span style={{ whiteSpace: 'nowrap' }}>{value}</span>,
    },
    {
      title: '资源名称',
      dataIndex: 'description',
      width: 220,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value: AccessType) => <Tag color={typeColorMap[value]}>{typeLabelMap[value]}</Tag>,
    },
    { title: '资源标识', dataIndex: 'url' },
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
            title='确定删除该资源吗？'
            description={
              record.children?.length ? '该资源包含下级资源，请确认后端是否允许删除。' : undefined
            }
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
          <Form.Item name='description' label='资源名称'>
            <Input placeholder='请输入资源名称' allowClear />
          </Form.Item>
          <Form.Item name='type' label='类型'>
            <Select placeholder='全部' allowClear options={typeOptions} style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name='url' label='资源标识'>
            <Input placeholder='请输入路由路径或功能标识' allowClear />
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
            新增资源
          </Button>
        </div>
        <Table<AccessTreeNode>
          rowKey='id'
          columns={columns}
          dataSource={treeData}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          expandable={{ defaultExpandAllRows: true }}
          footer={() => `共 ${total} 条`}
        />
      </Card>

      <Modal
        title={editing ? '编辑资源' : '新增资源'}
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
            name='description'
            label='资源名称'
            rules={[{ required: true, message: '请输入资源名称' }]}
          >
            <Input placeholder='请输入资源名称' allowClear />
          </Form.Item>
          <Form.Item name='type' label='类型' rules={[{ required: true, message: '请选择类型' }]}>
            <Select
              options={typeOptions}
              onChange={(value: AccessType) => {
                const parentId = modalForm.getFieldValue('parentId')
                const parent = flatData.find((item) => item.id === parentId)
                if (
                  value === 'feature' &&
                  (parentId === ROOT_PARENT_VALUE || parent?.type !== 'menu')
                ) {
                  modalForm.setFieldValue('parentId', undefined)
                }
              }}
            />
          </Form.Item>
          <Form.Item
            name='url'
            label='资源标识'
            rules={[{ required: true, message: '请输入资源标识' }]}
          >
            <Input placeholder='菜单填路由路径，功能填权限标识，例如 menu:add' allowClear />
          </Form.Item>
          <Form.Item
            name='parentId'
            label='上级资源'
            rules={[
              { required: true, message: '请选择上级资源' },
              {
                validator: (_, value: number | undefined) => {
                  const type = modalForm.getFieldValue('type') as AccessType | undefined
                  const parent = flatData.find((item) => item.id === value)

                  if (type === 'feature' && value === ROOT_PARENT_VALUE) {
                    return Promise.reject(new Error('功能必须选择所属菜单'))
                  }

                  if (type === 'feature' && parent?.type !== 'menu') {
                    return Promise.reject(new Error('功能只能挂在菜单下'))
                  }

                  if (parent?.type === 'feature') {
                    return Promise.reject(new Error('功能不能作为上级资源'))
                  }

                  return Promise.resolve()
                },
              },
            ]}
          >
            <Select
              options={parentOptions}
              placeholder={selectedType === 'feature' ? '请选择所属菜单' : '请选择上级资源'}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AccessListPage

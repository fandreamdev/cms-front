import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import {
  createAccess,
  deleteAccess,
  getAccessTree,
  updateAccess,
  type Access,
  type AccessQuery,
  type AccessTree,
} from '../../api/access'
import { useTableScrollY } from '../../hooks/useTableScrollY'
import AccessFormModal from './AccessFormModal'
import AccessSearchForm from './AccessSearchForm'
import { createAccessColumns } from './accessColumns'
import { ROOT_PARENT_VALUE } from './constants'
import {
  addDisplayNo,
  buildParentOptions,
  filterAccessTree,
  flattenAccessTree,
  toAccessPayload,
} from './treeUtils'
import type { AccessFormValues, AccessTreeNode } from './types'

const AccessListPage = () => {
  const [searchForm] = Form.useForm<AccessQuery>()
  const [modalForm] = Form.useForm<AccessFormValues>()
  const selectedType = Form.useWatch('type', modalForm)

  const [tree, setTree] = useState<AccessTree[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<AccessQuery>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Access | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const { ref: tableWrapRef, scrollY } = useTableScrollY()

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <AccessSearchForm
          form={searchForm}
          onSearch={handleSearch}
          onReset={handleReset}
          onCreate={openCreate}
        />
      </Card>

      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={tableWrapRef} style={{ height: '100%' }}>
          <Table<AccessTreeNode>
            rowKey='id'
            columns={createAccessColumns({ onEdit: openEdit, onDelete: handleDelete })}
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
    </div>
  )
}

export default AccessListPage

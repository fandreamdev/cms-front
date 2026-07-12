import { useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import {
  createTag,
  deleteTag,
  getTag,
  getTagList,
  updateTag,
  type Tag,
  type TagPayload,
  type TagQuery,
} from '../../api/tag'
import DetailModal from '../../components/DetailModal'
import { usePagedQuery } from '../../shared/hooks/usePagedQuery'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import TagFormModal from './TagFormModal'
import TagSearchForm from './TagSearchForm'
import { createTagColumns } from './tagColumns'
import { queryKeys } from '../../app/queryKeys'
import { useQueryClient } from '@tanstack/react-query'

const initialQuery: TagQuery = { page: 1, pageSize: 10 }

const TagListPage = () => {
  const [searchForm] = Form.useForm<TagQuery>()
  const queryClient = useQueryClient()
  const [modalForm] = Form.useForm<TagPayload>()
  const { data, total, loading, query, setQuery } = usePagedQuery(
    initialQuery,
    getTagList,
    queryKeys.tags.all,
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Tag | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<Tag | null>(null)
  const { ref, scrollY } = useTableScrollY()

  const openCreate = () => {
    setEditing(null)
    modalForm.resetFields()
    modalForm.setFieldsValue({ sort: 100 })
    setModalOpen(true)
  }

  const openEdit = async (record: Tag) => {
    setEditing(record)
    modalForm.resetFields()
    setModalOpen(true)
    try {
      const tag = await queryClient.fetchQuery({
        queryKey: queryKeys.tags.detail(record.id),
        queryFn: () => getTag(record.id),
      })
      setEditing(tag)
      modalForm.setFieldsValue({ name: tag.name, description: tag.description, sort: tag.sort })
    } catch {
      setModalOpen(false)
    }
  }

  const openDetail = async (id: number) => {
    setDetail(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      setDetail(
        await queryClient.fetchQuery({
          queryKey: queryKeys.tags.detail(id),
          queryFn: () => getTag(id),
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
    const payload = { ...values, description: values.description || null }
    setSubmitting(true)
    try {
      if (editing) await updateTag(editing.id, payload)
      else await createTag(payload)
      message.success(editing ? '更新成功' : '新增成功')
      setModalOpen(false)
      queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    await deleteTag(id)
    message.success('删除成功')
    if (data.length === 1 && (query.page ?? 1) > 1)
      setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    else queryClient.invalidateQueries({ queryKey: queryKeys.tags.all })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <TagSearchForm
          form={searchForm}
          onSearch={() =>
            setQuery((prev) => ({ ...prev, ...searchForm.getFieldsValue(), page: 1 }))
          }
          onReset={() => {
            searchForm.resetFields()
            setQuery(initialQuery)
          }}
          onCreate={openCreate}
        />
      </Card>
      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={ref} style={{ height: '100%' }}>
          <Table<Tag>
            rowKey="id"
            columns={createTagColumns({
              startIndex: ((query.page ?? 1) - 1) * (query.pageSize ?? 10),
              onView: openDetail,
              onEdit: openEdit,
              onDelete: handleDelete,
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
      <TagFormModal
        form={modalForm}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="标签详情"
        open={detailOpen}
        loading={detailLoading}
        onCancel={() => setDetailOpen(false)}
        items={
          detail
            ? [
                { label: 'ID', children: detail.id },
                { label: '标签名称', children: detail.name },
                { label: '标签描述', children: detail.description || '-' },
                { label: '排序', children: detail.sort },
                { label: '创建时间', children: new Date(detail.createdAt).toLocaleString() },
                { label: '更新时间', children: new Date(detail.updatedAt).toLocaleString() },
              ]
            : []
        }
      />
    </div>
  )
}

export default TagListPage

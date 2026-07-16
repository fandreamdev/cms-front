import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Form, Input, Space, Table, message } from 'antd'
import { DatabaseOutlined, PlusOutlined } from '@ant-design/icons'
import {
  deleteWebsiteSetting,
  getWebsiteSetting,
  getWebsiteSettings,
  saveWebsiteSetting,
  type WebsiteSetting,
} from '../../api/setting'
import { queryKeys } from '../../app/queryKeys'
import { BUTTON_PERMISSIONS } from '../../config/permissions'
import DetailModal from '../../components/DetailModal'
import { usePermission } from '../../shared/hooks/usePermission'
import { useTableScrollY } from '../../shared/hooks/useTableScrollY'
import SettingFormModal from './SettingFormModal'
import { createSettingColumns } from './settingColumns'
import { parseSettingValue, stringifySettingValue } from './settingUtils'
import type { WebsiteSettingFormValues } from './types'
import { CORE_WEBSITE_SETTINGS } from '../../config/websiteSettings'

const SettingListPage = () => {
  const queryClient = useQueryClient()
  const can = usePermission()
  const [form] = Form.useForm<WebsiteSettingFormValues>()
  const [keyword, setKeyword] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WebsiteSetting | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState<WebsiteSetting | null>(null)
  const { ref, scrollY } = useTableScrollY()
  const { data = [], isFetching: loading } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: getWebsiteSettings,
  })

  const filteredData = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return data
    return data.filter(
      (setting) =>
        setting.key.toLowerCase().includes(normalizedKeyword) ||
        setting.description?.toLowerCase().includes(normalizedKeyword),
    )
  }, [data, keyword])
  const missingCoreSettings = useMemo(
    () => CORE_WEBSITE_SETTINGS.filter((item) => !data.some((setting) => setting.key === item.key)),
    [data],
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ valueText: '{}', isPublic: false })
    setModalOpen(true)
  }

  const openEdit = (setting: WebsiteSetting) => {
    setEditing(setting)
    form.setFieldsValue({
      key: setting.key,
      valueText: stringifySettingValue(setting.value),
      isPublic: setting.isPublic,
      description: setting.description ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await saveWebsiteSetting(values.key, {
        value: parseSettingValue(values.valueText),
        isPublic: values.isPublic,
        description: values.description?.trim() || null,
      })
      message.success(editing ? '更新成功' : '新增成功')
      setModalOpen(false)
      await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
      queryClient.removeQueries({ queryKey: queryKeys.settings.detail(values.key) })
      if (values.isPublic || editing?.isPublic)
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.public })
    } finally {
      setSubmitting(false)
    }
  }

  const showDetail = async (key: string) => {
    setDetail(null)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const setting = await queryClient.fetchQuery({
        queryKey: queryKeys.settings.detail(key),
        queryFn: () => getWebsiteSetting(key),
      })
      setDetail(setting)
    } catch {
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (key: string) => {
    const deleted = data.find((setting) => setting.key === key)
    await deleteWebsiteSetting(key)
    message.success('删除成功')
    queryClient.removeQueries({ queryKey: queryKeys.settings.detail(key) })
    await queryClient.invalidateQueries({ queryKey: queryKeys.settings.all })
    if (deleted?.isPublic) queryClient.invalidateQueries({ queryKey: queryKeys.settings.public })
  }

  const initializeCoreSettings = async () => {
    if (!missingCoreSettings.length || initializing) return
    setInitializing(true)
    try {
      await Promise.all(
        missingCoreSettings.map((setting) => saveWebsiteSetting(setting.key, setting.payload)),
      )
      message.success(`已初始化 ${missingCoreSettings.length} 项基础设置`)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.settings.public }),
      ])
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card>
        <Space wrap>
          {can(BUTTON_PERMISSIONS.setting.edit) && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增设置
            </Button>
          )}
          {can(BUTTON_PERMISSIONS.setting.edit) && missingCoreSettings.length > 0 && (
            <Button
              icon={<DatabaseOutlined />}
              loading={initializing}
              onClick={() => void initializeCoreSettings()}
            >
              初始化基础设置（{missingCoreSettings.length}）
            </Button>
          )}
          <Input.Search
            allowClear
            placeholder="搜索设置键或描述"
            style={{ width: 320 }}
            onSearch={setKeyword}
            onChange={(event) => {
              if (!event.target.value) setKeyword('')
            }}
          />
        </Space>
      </Card>
      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={ref} style={{ height: '100%' }}>
          <Table<WebsiteSetting>
            rowKey="key"
            columns={createSettingColumns({
              onView: (key) => void showDetail(key),
              onEdit: openEdit,
              onDelete: handleDelete,
              canView: can(BUTTON_PERMISSIONS.setting.view),
              canEdit: can(BUTTON_PERMISSIONS.setting.edit),
              canDelete: can(BUTTON_PERMISSIONS.setting.delete),
            })}
            dataSource={filteredData}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content', y: scrollY }}
            footer={() => `共 ${filteredData.length} 条`}
          />
        </div>
      </Card>
      <SettingFormModal
        form={form}
        open={modalOpen}
        editing={editing}
        submitting={submitting}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalOpen(false)}
      />
      <DetailModal
        title="网站设置详情"
        open={detailOpen}
        loading={detailLoading}
        onCancel={() => setDetailOpen(false)}
        items={
          detail
            ? [
                { label: 'ID', children: detail.id },
                { label: '设置键', children: detail.key },
                {
                  label: '设置值',
                  children: (
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {stringifySettingValue(detail.value)}
                    </pre>
                  ),
                },
                { label: '公开状态', children: detail.isPublic ? '公开' : '私有' },
                { label: '描述', children: detail.description || '-' },
                { label: '创建时间', children: new Date(detail.createdAt).toLocaleString() },
                { label: '更新时间', children: new Date(detail.updatedAt).toLocaleString() },
              ]
            : []
        }
      />
    </div>
  )
}

export default SettingListPage

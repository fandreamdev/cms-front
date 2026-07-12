import { Form, Input, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { Access, AccessTree, AccessType } from '../../api/access'
import { ROOT_PARENT_VALUE, typeOptions } from './constants'
import type { AccessFormValues } from './types'

interface AccessFormModalProps {
  form: FormInstance<AccessFormValues>
  open: boolean
  editing: Access | null
  submitting: boolean
  selectedType?: AccessType
  flatData: AccessTree[]
  parentOptions: { label: string; value: number; disabled?: boolean }[]
  onOk: () => void
  onCancel: () => void
}

const AccessFormModal = ({
  form,
  open,
  editing,
  submitting,
  selectedType,
  flatData,
  parentOptions,
  onOk,
  onCancel,
}: AccessFormModalProps) => (
  <Modal
    title={editing ? '编辑资源' : '新增资源'}
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    confirmLoading={submitting}
    okText="确定"
    cancelText="取消"
    destroyOnHidden
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="description"
        label="资源名称"
        rules={[{ required: true, message: '请输入资源名称' }]}
      >
        <Input placeholder="请输入资源名称" allowClear />
      </Form.Item>
      <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
        <Select
          options={typeOptions}
          onChange={(value: AccessType) => {
            const parentId = form.getFieldValue('parentId')
            const parent = flatData.find((item) => item.id === parentId)
            if (
              value === 'feature' &&
              (parentId === ROOT_PARENT_VALUE || parent?.type !== 'menu')
            ) {
              form.setFieldValue('parentId', undefined)
            }
          }}
        />
      </Form.Item>
      <Form.Item
        name="url"
        label="资源标识"
        rules={[{ required: true, message: '请输入资源标识' }]}
      >
        <Input placeholder="菜单填路由路径，功能填权限标识，例如 menu:add" allowClear />
      </Form.Item>
      <Form.Item
        name="parentId"
        label="上级资源"
        rules={[
          { required: true, message: '请选择上级资源' },
          {
            validator: (_, value: number | undefined) => {
              const type = form.getFieldValue('type') as AccessType | undefined
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
)

export default AccessFormModal

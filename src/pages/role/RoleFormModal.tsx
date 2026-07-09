import { Form, Input, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { Role, RolePayload } from '../../api/role'

interface RoleFormModalProps {
  form: FormInstance<RolePayload>
  open: boolean
  editing: Role | null
  submitting: boolean
  onOk: () => void
  onCancel: () => void
}

const RoleFormModal = ({ form, open, editing, submitting, onOk, onCancel }: RoleFormModalProps) => (
  <Modal
    title={editing ? '编辑角色' : '新增角色'}
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    confirmLoading={submitting}
    okText='确定'
    cancelText='取消'
    destroyOnHidden
  >
    <Form form={form} layout='vertical'>
      <Form.Item
        name='name'
        label='角色名称'
        rules={[{ required: true, message: '请输入角色名称' }]}
      >
        <Input placeholder='请输入角色名称' allowClear />
      </Form.Item>
    </Form>
  </Modal>
)

export default RoleFormModal

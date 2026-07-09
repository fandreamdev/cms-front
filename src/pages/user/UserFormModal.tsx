import { Form, Input, Modal, Select } from 'antd'
import type { FormInstance } from 'antd'
import type { User, UserPayload } from '../../api/user'
import { statusOptions, superOptions } from './constants'

interface UserFormModalProps {
  form: FormInstance<UserPayload>
  open: boolean
  editing: User | null
  submitting: boolean
  onOk: () => void
  onCancel: () => void
}

const UserFormModal = ({ form, open, editing, submitting, onOk, onCancel }: UserFormModalProps) => (
  <Modal
    title={editing ? '编辑用户' : '新增用户'}
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
      <Form.Item name='email' label='邮箱' rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
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
)

export default UserFormModal

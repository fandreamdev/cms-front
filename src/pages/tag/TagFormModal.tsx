import { Form, Input, Modal } from 'antd'
import type { FormInstance } from 'antd'
import type { Tag, TagPayload } from '../../api/tag'

interface Props { form: FormInstance<TagPayload>; open: boolean; editing: Tag | null; submitting: boolean; onOk: () => void; onCancel: () => void }

const TagFormModal = ({ form, open, editing, submitting, onOk, onCancel }: Props) => (
  <Modal title={editing ? '编辑标签' : '新增标签'} open={open} onOk={onOk} onCancel={onCancel} confirmLoading={submitting} okText='确定' cancelText='取消' destroyOnHidden>
    <Form form={form} layout='vertical'>
      <Form.Item name='name' label='标签名称' rules={[{ required: true, message: '请输入标签名称' }]}><Input placeholder='请输入标签名称' /></Form.Item>
      <Form.Item name='description' label='标签描述'><Input.TextArea rows={4} placeholder='请输入标签描述' /></Form.Item>
      <Form.Item name='sort' label='排序' rules={[{ required: true }]}><Input type='number' placeholder='数值越小越靠前' /></Form.Item>
    </Form>
  </Modal>
)

export default TagFormModal

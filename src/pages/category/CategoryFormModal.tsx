import { Form, Input, Modal, TreeSelect } from 'antd'
import type { FormInstance, TreeSelectProps } from 'antd'
import type { Category, CategoryPayload } from '../../api/category'

interface Props {
  form: FormInstance<CategoryPayload & { parentId: number }>
  open: boolean
  editing: Category | null
  submitting: boolean
  parentTreeData: TreeSelectProps['treeData']
  onOk: () => void
  onCancel: () => void
}

const CategoryFormModal = ({
  form,
  open,
  editing,
  submitting,
  parentTreeData,
  onOk,
  onCancel,
}: Props) => (
  <Modal
    title={editing ? '编辑分类' : '新增分类'}
    open={open}
    onOk={onOk}
    onCancel={onCancel}
    confirmLoading={submitting}
    okText="确定"
    cancelText="取消"
    forceRender
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="name"
        label="分类名称"
        rules={[{ required: true, message: '请输入分类名称' }]}
      >
        <Input placeholder="请输入分类名称" />
      </Form.Item>
      <Form.Item name="description" label="分类描述">
        <Input.TextArea rows={4} placeholder="请输入分类描述" />
      </Form.Item>
      <Form.Item
        name="parentId"
        label="上级分类"
        rules={[{ required: true, message: '请选择上级分类' }]}
      >
        <TreeSelect
          treeData={parentTreeData}
          treeDefaultExpandAll
          showSearch
          treeNodeFilterProp="title"
        />
      </Form.Item>
      <Form.Item name="sort" label="排序" rules={[{ required: true }]}>
        <Input type="number" placeholder="数值越小越靠前" />
      </Form.Item>
    </Form>
  </Modal>
)

export default CategoryFormModal

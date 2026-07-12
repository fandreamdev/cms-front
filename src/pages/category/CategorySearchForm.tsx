import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Input, Space } from 'antd'
import type { FormInstance } from 'antd'

export interface CategorySearchValues {
  name?: string
  description?: string
}
interface Props {
  form: FormInstance<CategorySearchValues>
  onSearch: () => void
  onReset: () => void
  onCreate?: () => void
}

const CategorySearchForm = ({ form, onSearch, onReset, onCreate }: Props) => (
  <Form form={form} onFinish={onSearch}>
    <Flex gap={24} wrap>
      <Form.Item name="name" label="分类名称">
        <Input placeholder="请输入分类名称" allowClear />
      </Form.Item>
      <Form.Item name="description" label="分类描述">
        <Input placeholder="请输入完整描述" allowClear />
      </Form.Item>
    </Flex>
    <Form.Item style={{ marginBottom: 0 }}>
      <Space>
        {onCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新增分类
          </Button>
        )}
        <Button type="primary" htmlType="submit">
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form.Item>
  </Form>
)

export default CategorySearchForm

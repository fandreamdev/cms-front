import { Button, Form, Input, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { RoleQuery } from '../../api/role'

interface RoleSearchFormProps {
  form: FormInstance<RoleQuery>
  onSearch: () => void
  onReset: () => void
}

const RoleSearchForm = ({ form, onSearch, onReset }: RoleSearchFormProps) => (
  <Form form={form} layout='inline' onFinish={onSearch}>
    <Form.Item name='name' label='角色名称'>
      <Input placeholder='请输入角色名称' allowClear />
    </Form.Item>
    <Form.Item>
      <Space>
        <Button type='primary' htmlType='submit'>
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form.Item>
  </Form>
)

export default RoleSearchForm

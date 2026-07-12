import { Button, Flex, Form, Input, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { RoleQuery } from '../../api/role'
import { PlusOutlined } from '@ant-design/icons'

interface RoleSearchFormProps {
  form: FormInstance<RoleQuery>
  onSearch: () => void
  onReset: () => void
  onCreate?: () => void
}

const RoleSearchForm = ({ form, onSearch, onReset, onCreate }: RoleSearchFormProps) => (
  <Form form={form} onFinish={onSearch}>
    <Flex gap={32} wrap>
      <Form.Item name="name" label="角色名称">
        <Input placeholder="请输入角色名称" allowClear />
      </Form.Item>
    </Flex>
    <Form.Item style={{ marginBottom: 0 }}>
      <Space>
        {onCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新增角色
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

export default RoleSearchForm

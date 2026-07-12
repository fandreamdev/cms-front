import { Button, Flex, Form, Input, Select, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { UserQuery } from '../../api/user'
import { statusOptions, superOptions } from './constants'
import { PlusOutlined } from '@ant-design/icons'

interface UserSearchFormProps {
  form: FormInstance<UserQuery>
  onSearch: () => void
  onReset: () => void
  onCreate?: () => void
}

const UserSearchForm = ({ form, onSearch, onReset, onCreate }: UserSearchFormProps) => (
  <Form form={form} onFinish={onSearch}>
    <Flex gap={32} wrap>
      <Form.Item name="username" label="用户名">
        <Input placeholder="请输入用户名" allowClear />
      </Form.Item>
      <Form.Item name="mobile" label="手机号">
        <Input placeholder="请输入手机号" allowClear />
      </Form.Item>
      <Form.Item name="email" label="邮箱">
        <Input placeholder="请输入邮箱" allowClear />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select placeholder="全部" allowClear options={statusOptions} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item name="isSuper" label="超管">
        <Select placeholder="全部" allowClear options={superOptions} style={{ width: 120 }} />
      </Form.Item>
    </Flex>
    <Form.Item style={{ marginBottom: 0 }}>
      <Space size={'large'}>
        {onCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新增用户
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

export default UserSearchForm

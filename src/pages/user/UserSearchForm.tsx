import { Button, Form, Input, Select, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { UserQuery } from '../../api/user'
import { statusOptions, superOptions } from './constants'

interface UserSearchFormProps {
  form: FormInstance<UserQuery>
  onSearch: () => void
  onReset: () => void
}

const UserSearchForm = ({ form, onSearch, onReset }: UserSearchFormProps) => (
  <Form form={form} layout='inline' onFinish={onSearch}>
    <Form.Item name='username' label='用户名'>
      <Input placeholder='请输入用户名' allowClear />
    </Form.Item>
    <Form.Item name='mobile' label='手机号'>
      <Input placeholder='请输入手机号' allowClear />
    </Form.Item>
    <Form.Item name='email' label='邮箱'>
      <Input placeholder='请输入邮箱' allowClear />
    </Form.Item>
    <Form.Item name='status' label='状态'>
      <Select placeholder='全部' allowClear options={statusOptions} style={{ width: 120 }} />
    </Form.Item>
    <Form.Item name='isSuper' label='超管'>
      <Select placeholder='全部' allowClear options={superOptions} style={{ width: 120 }} />
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

export default UserSearchForm

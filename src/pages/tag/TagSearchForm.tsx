import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Input, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { TagQuery } from '../../api/tag'

interface Props { form: FormInstance<TagQuery>; onSearch: () => void; onReset: () => void; onCreate: () => void }

const TagSearchForm = ({ form, onSearch, onReset, onCreate }: Props) => (
  <Form form={form} onFinish={onSearch}>
    <Flex gap={24} wrap>
      <Form.Item name='name' label='标签名称'><Input placeholder='请输入标签名称' allowClear /></Form.Item>
      <Form.Item name='description' label='标签描述'><Input placeholder='请输入完整描述' allowClear /></Form.Item>
    </Flex>
    <Form.Item style={{ marginBottom: 0 }}><Space>
      <Button type='primary' icon={<PlusOutlined />} onClick={onCreate}>新增标签</Button>
      <Button type='primary' htmlType='submit'>查询</Button><Button onClick={onReset}>重置</Button>
    </Space></Form.Item>
  </Form>
)

export default TagSearchForm

import { Button, Flex, Form, Input, Select, Space } from 'antd'
import type { FormInstance } from 'antd'
import type { AccessQuery } from '../../api/access'
import { typeOptions } from './constants'
import { PlusOutlined } from '@ant-design/icons'

interface AccessSearchFormProps {
  form: FormInstance<AccessQuery>
  onSearch: () => void
  onReset: () => void
  onCreate: () => void
}

const AccessSearchForm = ({ form, onSearch, onReset, onCreate }: AccessSearchFormProps) => (
  <Form form={form} onFinish={onSearch} size={'medium'}>
    <Flex gap={32} wrap>
      <Form.Item name='description' label='资源名称'>
        <Input placeholder='请输入资源名称' allowClear />
      </Form.Item>
      <Form.Item name='type' label='类型'>
        <Select placeholder='全部' allowClear options={typeOptions} style={{ width: 120 }} />
      </Form.Item>
      <Form.Item name='url' label='资源标识'>
        <Input placeholder='请输入路由路径或功能标识' allowClear />
      </Form.Item>
    </Flex>

    <Form.Item style={{ marginBottom: 0 }}>
      <Space size={'medium'}>
        <Button type='primary' icon={<PlusOutlined />} onClick={onCreate}>
          新增资源
        </Button>
        <Button type='primary' htmlType='submit'>
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form.Item>
  </Form>
)

export default AccessSearchForm

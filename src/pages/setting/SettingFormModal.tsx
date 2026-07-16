import { Form, Input, Modal, Switch, Typography } from 'antd'
import type { FormInstance } from 'antd'
import type { WebsiteSetting } from '../../api/setting'
import type { WebsiteSettingFormValues } from './types'
import { parseSettingValue } from './settingUtils'

interface Props {
  form: FormInstance<WebsiteSettingFormValues>
  open: boolean
  editing: WebsiteSetting | null
  submitting: boolean
  onOk: () => void
  onCancel: () => void
}

const SettingFormModal = ({ form, open, editing, submitting, onOk, onCancel }: Props) => (
  <Modal
    title={editing ? '编辑网站设置' : '新增网站设置'}
    open={open}
    width={720}
    onOk={onOk}
    onCancel={onCancel}
    confirmLoading={submitting}
    okText="保存"
    cancelText="取消"
    forceRender
  >
    <Form form={form} layout="vertical">
      <Form.Item
        name="key"
        label="设置键"
        rules={[
          { required: true, message: '请输入设置键' },
          { max: 100, message: '设置键不能超过 100 个字符' },
          {
            pattern: /^[A-Za-z0-9:_-]+$/,
            message: '只能使用字母、数字、冒号、下划线和连字符',
          },
        ]}
        extra="推荐使用冒号划分命名空间，例如 site:branding"
      >
        <Input disabled={Boolean(editing)} placeholder="例如 site:branding" />
      </Form.Item>
      <Form.Item
        name="valueText"
        label="设置值（JSON）"
        rules={[
          { required: true, whitespace: true, message: '请输入 JSON 设置值' },
          {
            validator: async (_, value: string | undefined) => {
              if (!value?.trim()) return
              try {
                const parsed = parseSettingValue(value)
                if (parsed === null) throw new Error('null is not supported')
              } catch {
                throw new Error('请输入有效的 JSON，且值不能为 null')
              }
            },
          },
        ]}
      >
        <Input.TextArea
          rows={12}
          spellCheck={false}
          placeholder={'对象：{"name":"CMS"}\n数组：[1,2,3]\n字符串："CMS"\n布尔值：true'}
          style={{ fontFamily: 'Consolas, Monaco, monospace' }}
        />
      </Form.Item>
      <Form.Item name="isPublic" label="公开设置" valuePropName="checked">
        <Switch checkedChildren="公开" unCheckedChildren="私有" />
      </Form.Item>
      <Typography.Paragraph type="secondary">
        只有公开设置会由公开接口返回。令牌、第三方密钥等敏感值必须保持私有。
      </Typography.Paragraph>
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={3} maxLength={500} showCount placeholder="请输入设置用途说明" />
      </Form.Item>
    </Form>
  </Modal>
)

export default SettingFormModal

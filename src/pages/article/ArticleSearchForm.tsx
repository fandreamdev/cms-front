import { PlusOutlined } from '@ant-design/icons'
import { Button, Flex, Form, Input, Select, Space, TreeSelect } from 'antd'
import type { FormInstance } from 'antd'
import type { TreeSelectProps } from 'antd'
import type { ArticleQuery } from '../../api/article'
import { approvalStatusMap } from './approval'

interface Props {
  form: FormInstance<ArticleQuery>
  onSearch: () => void
  onReset: () => void
  onCreate?: () => void
  categoryTreeData: TreeSelectProps['treeData']
  showApprovalFilter?: boolean
  canSearch: boolean
}

const ArticleSearchForm = ({
  form,
  onSearch,
  onReset,
  onCreate,
  categoryTreeData,
  showApprovalFilter = true,
  canSearch,
}: Props) => (
  <Form form={form} onFinish={onSearch}>
    <Flex gap={24} wrap>
      <Form.Item name="title" label="文章标题">
        <Input placeholder="请输入文章标题" allowClear />
      </Form.Item>
      <Form.Item name="summary" label="摘要">
        <Input placeholder="请输入完整摘要" allowClear />
      </Form.Item>
      <Form.Item name="status" label="状态">
        <Select
          placeholder="全部状态"
          allowClear
          style={{ width: 140 }}
          options={[
            { label: '已下架', value: 0 },
            { label: '已上架', value: 1 },
          ]}
        />
      </Form.Item>
      <Form.Item name="categoryId" label="分类">
        <TreeSelect
          allowClear
          treeData={categoryTreeData}
          placeholder="全部分类"
          treeDefaultExpandAll
          showSearch
          treeNodeFilterProp="title"
          style={{ width: 180 }}
        />
      </Form.Item>
      {showApprovalFilter && (
        <Form.Item name="approvalStatus" label="审批状态">
          <Select
            placeholder="全部审批状态"
            allowClear
            style={{ width: 160 }}
            options={Object.entries(approvalStatusMap).map(([value, item]) => ({
              value,
              label: item.text,
            }))}
          />
        </Form.Item>
      )}
    </Flex>
    <Form.Item style={{ marginBottom: 0 }}>
      <Space>
        {onCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
            新增文章
          </Button>
        )}
        {canSearch && (
          <Button type="primary" htmlType="submit">
            查询
          </Button>
        )}
        <Button onClick={onReset}>重置</Button>
      </Space>
    </Form.Item>
  </Form>
)

export default ArticleSearchForm

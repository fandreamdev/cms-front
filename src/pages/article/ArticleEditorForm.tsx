import { lazy, Suspense } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { Button, Col, Form, Image, Input, Row, Select, Space, Spin, TreeSelect, Upload } from 'antd'
import type { FormInstance, TreeSelectProps, UploadProps } from 'antd'
import type { ArticlePayload } from '../../api/article'
import type { Category } from '../../api/category'
import type { Tag } from '../../api/tag'
import { resolveAssetUrl } from '../../utils/asset'

const ArticleContentEditor = lazy(() => import('../../components/ArticleContentEditor'))

const toCategoryTreeData = (nodes: Category[]): TreeSelectProps['treeData'] =>
  nodes.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: toCategoryTreeData(item.children ?? []),
  }))

interface Props {
  form: FormInstance<ArticlePayload>
  categories: Category[]
  tags: Tag[]
  coverUrl?: string | null
  coverUploading: boolean
  uploadCover: UploadProps['customRequest']
  validateCover: UploadProps['beforeUpload']
}

const ArticleEditorForm = ({
  form,
  categories,
  tags,
  coverUrl,
  coverUploading,
  uploadCover,
  validateCover,
}: Props) => (
  <Form form={form} layout="vertical" style={{ maxWidth: 1100, margin: '0 auto' }}>
    <Form.Item
      name="title"
      label="文章标题"
      rules={[{ required: true, message: '请输入文章标题' }]}
    >
      <Input size="large" placeholder="请输入文章标题" />
    </Form.Item>
    <Row gutter={16}>
      <Col xs={24} md={12}>
        <Form.Item
          name="categoryId"
          label="文章分类"
          rules={[{ required: true, message: '请选择文章分类' }]}
        >
          <TreeSelect
            treeData={toCategoryTreeData(categories)}
            placeholder="请选择文章分类"
            treeDefaultExpandAll
            showSearch={{ treeNodeFilterProp: 'title' }}
          />
        </Form.Item>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item name="tagIds" label="文章标签">
          <Select
            mode="multiple"
            allowClear
            showSearch={{ optionFilterProp: 'label' }}
            options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
            placeholder="请选择文章标签"
            maxTagCount="responsive"
          />
        </Form.Item>
      </Col>
    </Row>
    <Form.Item name="summary" label="摘要">
      <Input.TextArea rows={2} placeholder="请输入文章摘要" />
    </Form.Item>
    <Form.Item name="coverUrl" hidden>
      <Input />
    </Form.Item>
    <Form.Item label="文章封面" tooltip="支持常见图片格式，最大 5MB">
      <Space size={12} wrap align="center">
        {coverUrl && (
          <Image
            src={resolveAssetUrl(coverUrl)}
            alt="文章封面预览"
            width={112}
            height={70}
            style={{ objectFit: 'cover', borderRadius: 6 }}
          />
        )}
        <Space>
          <Upload
            accept="image/*"
            showUploadList={false}
            beforeUpload={validateCover}
            customRequest={uploadCover}
          >
            <Button icon={<UploadOutlined />} loading={coverUploading}>
              {coverUrl ? '更换封面' : '选择本地图片'}
            </Button>
          </Upload>
          {coverUrl && (
            <Button danger onClick={() => form.setFieldValue('coverUrl', null)}>
              移除封面
            </Button>
          )}
        </Space>
      </Space>
    </Form.Item>
    <Form.Item label="正文">
      <Form.Item name="content" noStyle rules={[{ required: true, message: '请输入正文' }]}>
        <Suspense fallback={<Spin tip="正在加载编辑器…" />}>
          <ArticleContentEditor />
        </Suspense>
      </Form.Item>
    </Form.Item>
    <Form.Item name="sort" label="排序" rules={[{ required: true }]} style={{ width: 160 }}>
      <Input type="number" />
    </Form.Item>
  </Form>
)

export default ArticleEditorForm

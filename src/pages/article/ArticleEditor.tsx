import { useEffect, useState } from 'react'
import { ArrowLeftOutlined, SaveOutlined, UploadOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Col,
  Form,
  Image,
  Input,
  Row,
  Select,
  Space,
  Spin,
  TreeSelect,
  Upload,
  message,
} from 'antd'
import type { TreeSelectProps, UploadProps } from 'antd'
import { useNavigate, useParams } from 'react-router'
import { createArticle, getArticle, updateArticle, type ArticlePayload } from '../../api/article'
import { getCategoryTree, type Category } from '../../api/category'
import { getTagList, type Tag } from '../../api/tag'
import ArticleContentEditor from '../../components/ArticleContentEditor'
import { uploadImage } from '../../api/upload'
import { resolveAssetUrl } from '../../utils/asset'

const toCategoryTreeData = (nodes: Category[]): TreeSelectProps['treeData'] =>
  nodes.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: toCategoryTreeData(item.children ?? []),
  }))

const toLocalDateTime = (value: string | null) => {
  if (!value) return undefined
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const ArticleEditorPage = () => {
  const { id } = useParams()
  const articleId = id ? Number(id) : null
  const editing = articleId !== null
  const navigate = useNavigate()
  const [form] = Form.useForm<ArticlePayload>()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const coverUrl = Form.useWatch('coverUrl', form)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [categoryTree, tagResult, article] = await Promise.all([
          getCategoryTree(),
          getTagList({ page: 1, pageSize: 1000 }),
          articleId === null ? Promise.resolve(null) : getArticle(articleId),
        ])
        setCategories(categoryTree)
        setTags(tagResult.list)
        if (article) {
          form.setFieldsValue({
            title: article.title,
            summary: article.summary,
            coverUrl: article.coverUrl,
            content: article.content,
            categoryId: article.categoryId,
            tagIds: article.tagIds ?? article.tags?.map((tag) => tag.id) ?? [],
            status: article.status,
            publishedAt: toLocalDateTime(article.publishedAt),
            sort: article.sort,
          })
        } else {
          form.setFieldsValue({ status: 0, sort: 100, tagIds: [], content: '' })
        }
      } catch {
        navigate('/admin/content/articles', { replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [articleId, form, navigate])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      summary: values.summary || null,
      coverUrl: values.coverUrl?.trim() || null,
      publishedAt: values.publishedAt ? new Date(values.publishedAt).toISOString() : null,
    }
    setSubmitting(true)
    try {
      if (articleId === null) await createArticle(payload)
      else await updateArticle(articleId, payload)
      message.success(editing ? '更新成功' : '新增成功')
      navigate('/admin/content/articles')
    } finally {
      setSubmitting(false)
    }
  }

  const uploadCover: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
    setCoverUploading(true)
    try {
      const result = await uploadImage(file as File)
      form.setFieldValue('coverUrl', resolveAssetUrl(result.url))
      message.success('封面上传成功')
      onSuccess?.(result)
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('上传失败'))
    } finally {
      setCoverUploading(false)
    }
  }

  const validateCover: UploadProps['beforeUpload'] = (file) => {
    if (!file.type.startsWith('image/')) {
      message.error('请选择图片文件')
      return Upload.LIST_IGNORE
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('图片大小不能超过 5MB')
      return Upload.LIST_IGNORE
    }
    return true
  }

  return (
    <Spin spinning={loading}>
      <Card
        title={editing ? '编辑文章' : '新增文章'}
        styles={{
          header: {
            position: 'sticky',
            top: 0,
            zIndex: 10,
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          },
        }}
        extra={
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/admin/content/articles')}
            >
              返回列表
            </Button>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={handleSubmit}
            >
              保存
            </Button>
          </Space>
        }
      >
        <Form form={form} layout='vertical' style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Form.Item
            name='title'
            label='文章标题'
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input size='large' placeholder='请输入文章标题' />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name='categoryId'
                label='文章分类'
                rules={[{ required: true, message: '请选择文章分类' }]}
              >
                <TreeSelect
                  treeData={toCategoryTreeData(categories)}
                  placeholder='请选择文章分类'
                  treeDefaultExpandAll
                  showSearch={{ treeNodeFilterProp: 'title' }}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name='tagIds' label='文章标签'>
                <Select
                  mode='multiple'
                  allowClear
                  showSearch={{ optionFilterProp: 'label' }}
                  options={tags.map((tag) => ({ label: tag.name, value: tag.id }))}
                  placeholder='请选择文章标签'
                  maxTagCount='responsive'
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name='summary' label='摘要'>
            <Input.TextArea rows={2} placeholder='请输入文章摘要' />
          </Form.Item>
          <Form.Item name='coverUrl' hidden>
            <Input />
          </Form.Item>
          <Form.Item label='文章封面' tooltip={'支持常见图片格式，最大 5MB'}>
            <Space size={12} wrap align='center'>
              {coverUrl && (
                <Image
                  src={resolveAssetUrl(coverUrl)}
                  alt='文章封面预览'
                  width={112}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 6 }}
                />
              )}
              <Space>
                <Upload
                  accept='image/*'
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
          <Form.Item label='正文'>
            <Form.Item name='content' noStyle rules={[{ required: true, message: '请输入正文' }]}>
              <ArticleContentEditor />
            </Form.Item>
          </Form.Item>
          <Space size='large' wrap>
            <Form.Item
              name='status'
              label='状态'
              rules={[{ required: true }]}
              style={{ width: 180 }}
            >
              <Select
                options={[
                  { label: '草稿', value: 0 },
                  { label: '已发布', value: 1 },
                ]}
              />
            </Form.Item>
            <Form.Item name='publishedAt' label='发布时间' style={{ width: 240 }}>
              <Input type='datetime-local' />
            </Form.Item>
            <Form.Item name='sort' label='排序' rules={[{ required: true }]} style={{ width: 160 }}>
              <Input type='number' />
            </Form.Item>
          </Space>
        </Form>
      </Card>
    </Spin>
  )
}

export default ArticleEditorPage

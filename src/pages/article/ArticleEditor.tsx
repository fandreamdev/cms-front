import { lazy, Suspense, useEffect, useState } from 'react'
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
import { useNavigate, useParams } from '@tanstack/react-router'
import {
  createArticle,
  getArticle,
  updateArticle,
  type Article,
  type ArticlePayload,
} from '../../api/article'
import { getCategoryTree, type Category } from '../../api/category'
import { getTagList, type Tag } from '../../api/tag'
import { uploadImage } from '../../api/upload'
import { resolveAssetUrl } from '../../utils/asset'
import { useAuth } from '../../contexts/authContextValue'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../app/queryKeys'

const ArticleContentEditor = lazy(() => import('../../components/ArticleContentEditor'))

const toCategoryTreeData = (nodes: Category[]): TreeSelectProps['treeData'] =>
  nodes.map((item) => ({
    title: item.name,
    value: item.id,
    key: item.id,
    children: toCategoryTreeData(item.children ?? []),
  }))

const ArticleEditorPage = () => {
  const { id } = useParams({ strict: false }) as { id?: string }
  const articleId = id ? Number(id) : null
  const editing = articleId !== null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [form] = Form.useForm<ArticlePayload>()
  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [article, setArticle] = useState<Article | null>(null)
  const coverUrl = Form.useWatch('coverUrl', form)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [categoryTree, tagResult, article] = await Promise.all([
          queryClient.fetchQuery({ queryKey: queryKeys.categories.tree, queryFn: getCategoryTree }),
          queryClient.fetchQuery({
            queryKey: queryKeys.tags.list({ page: 1, pageSize: 1000 }),
            queryFn: () => getTagList({ page: 1, pageSize: 1000 }),
          }),
          articleId === null
            ? Promise.resolve(null)
            : queryClient.fetchQuery({
                queryKey: queryKeys.articles.detail(articleId),
                queryFn: () => getArticle(articleId),
              }),
        ])
        setCategories(categoryTree)
        setTags(tagResult.list)
        if (article) {
          if (
            article.authorId !== user?.id ||
            !['draft', 'approved', 'rejected'].includes(article.approvalStatus)
          ) {
            message.error('当前文章状态不允许编辑')
            navigate({ to: '/admin/content/articles', replace: true })
            return
          }
          setArticle(article)
          form.setFieldsValue({
            title: article.title,
            summary: article.summary,
            coverUrl: article.coverUrl,
            content: article.content,
            categoryId: article.categoryId,
            tagIds: article.tagIds ?? article.tags?.map((tag) => tag.id) ?? [],
            sort: article.sort,
          })
        } else {
          form.setFieldsValue({ sort: 100, tagIds: [], content: '' })
        }
      } catch {
        navigate({ to: '/admin/content/articles', replace: true })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [articleId, form, navigate, queryClient, user?.id])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      summary: values.summary || null,
      coverUrl: values.coverUrl?.trim() || null,
    }
    setSubmitting(true)
    try {
      if (articleId === null) await createArticle(payload)
      else await updateArticle(articleId, payload)
      message.success(editing ? '更新成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all })
      navigate({ to: '/admin/content/articles' })
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
              onClick={() => navigate({ to: '/admin/content/articles' })}
            >
              返回列表
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={submitting}
              onClick={handleSubmit}
            >
              {article && ['approved', 'rejected'].includes(article.approvalStatus)
                ? '提交审核'
                : '保存'}
            </Button>
          </Space>
        }
      >
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
          <Form.Item label="文章封面" tooltip={'支持常见图片格式，最大 5MB'}>
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
          <Space size="large" wrap>
            <Form.Item name="sort" label="排序" rules={[{ required: true }]} style={{ width: 160 }}>
              <Input type="number" />
            </Form.Item>
          </Space>
        </Form>
      </Card>
    </Spin>
  )
}

export default ArticleEditorPage

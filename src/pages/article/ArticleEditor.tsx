import { useEffect, useState } from 'react'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { Button, Card, Form, Space, Spin, Upload, message, theme } from 'antd'
import type { UploadProps } from 'antd'
import { useNavigate, useParams } from '@tanstack/react-router'
import { createArticle, getArticle, updateArticle, type ArticlePayload } from '../../api/article'
import { getCategoryTree, type Category } from '../../api/category'
import { getTagList, type Tag } from '../../api/tag'
import { uploadImage } from '../../api/upload'
import { resolveAssetUrl } from '../../utils/asset'
import { useAuth } from '../../contexts/authContextValue'
import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../app/queryKeys'
import ArticleEditorForm from './ArticleEditorForm'
import { getArticleCapabilities } from './articlePolicy'

const ArticleEditorPage = () => {
  const {
    token: { colorBgContainer, boxShadowSecondary },
  } = theme.useToken()
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
          if (!getArticleCapabilities(article, user).canEdit) {
            message.error('审批中或已下架的文章不能编辑')
            navigate({ to: '/admin/content/articles', replace: true })
            return
          }
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
  }, [articleId, form, navigate, queryClient, user])

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
            background: colorBgContainer,
            boxShadow: boxShadowSecondary,
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
              保存
            </Button>
          </Space>
        }
      >
        <ArticleEditorForm
          form={form}
          categories={categories}
          tags={tags}
          coverUrl={coverUrl}
          coverUploading={coverUploading}
          uploadCover={uploadCover}
          validateCover={validateCover}
        />
      </Card>
    </Spin>
  )
}

export default ArticleEditorPage

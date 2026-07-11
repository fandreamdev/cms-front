import { useEffect, useState } from 'react'
import { Card, Form, Table, message } from 'antd'
import type { TreeSelectProps } from 'antd'
import { deleteArticle, getArticleList, type Article, type ArticleQuery } from '../../api/article'
import { useNavigate } from 'react-router'
import { usePagedList } from '../../hooks/usePagedList'
import { useTableScrollY } from '../../hooks/useTableScrollY'
import ArticleSearchForm from './ArticleSearchForm'
import { createArticleColumns } from './articleColumns'
import { getCategoryTree, type Category } from '../../api/category'

const initialQuery: ArticleQuery = { page: 1, pageSize: 10 }
const toCategoryTreeData = (nodes: Category[]): TreeSelectProps['treeData'] => nodes.map((item) => ({
  title: item.name,
  value: item.id,
  key: item.id,
  children: toCategoryTreeData(item.children ?? []),
}))

const ArticleListPage = () => {
  const [searchForm] = Form.useForm<ArticleQuery>()
  const navigate = useNavigate()
  const { data, total, loading, query, setQuery, fetchData } = usePagedList(initialQuery, getArticleList)
  const [categories, setCategories] = useState<Category[]>([])
  const { ref, scrollY } = useTableScrollY()

  useEffect(() => {
    getCategoryTree().then(setCategories).catch(() => setCategories([]))
  }, [])

  const handleDelete = async (id: number) => {
    await deleteArticle(id)
    message.success('删除成功')
    if (data.length === 1 && (query.page ?? 1) > 1) setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) - 1 }))
    else fetchData()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <Card><ArticleSearchForm form={searchForm} categoryTreeData={toCategoryTreeData(categories)} onSearch={() => setQuery((prev) => ({ ...prev, ...searchForm.getFieldsValue(), page: 1 }))} onReset={() => { searchForm.resetFields(); setQuery(initialQuery) }} onCreate={() => navigate('/admin/content/articles/new')} /></Card>
      <Card style={{ flex: 1, minHeight: 0 }} styles={{ body: { height: '100%' } }}>
        <div ref={ref} style={{ height: '100%' }}>
          <Table<Article>
            rowKey='id' columns={createArticleColumns({ startIndex: ((query.page ?? 1) - 1) * (query.pageSize ?? 10), onView: (id) => navigate(`/admin/content/articles/${id}`), onEdit: (record) => navigate(`/admin/content/articles/${record.id}/edit`), onDelete: handleDelete })}
            dataSource={data} loading={loading} scroll={{ x: 'max-content', y: scrollY }}
            pagination={{ current: query.page, pageSize: query.pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, pageSize })) }}
          />
        </div>
      </Card>
    </div>
  )
}

export default ArticleListPage

import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router'
import AdminLayout from '../layout/AdminLayout'
import HomePage from '../pages/HomePage'
import UserListPage from '../pages/user/UserList'
import RoleListPage from '../pages/role/RoleList'
import AccessListPage from '../pages/access/AccessList'
import ArticleListPage from '../pages/article/ArticleList'
import TagListPage from '../pages/tag/TagList'
import CategoryListPage from '../pages/category/CategoryList'
import ArticleEditorPage from '../pages/article/ArticleEditor'
import ArticleDetailPage from '../pages/article/ArticleDetail'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to='/admin' />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'content',
        children: [
          { index: true, element: <Navigate to='/admin/content/articles' /> },
          { path: 'articles', element: <ArticleListPage /> },
          { path: 'articles/new', element: <ArticleEditorPage /> },
          { path: 'articles/:id/edit', element: <ArticleEditorPage /> },
          { path: 'articles/:id', element: <ArticleDetailPage /> },
          { path: 'categories', element: <CategoryListPage /> },
          { path: 'tags', element: <TagListPage /> },
        ],
      },
      {
        path: 'system',
        children: [
          {
            index: true,
            element: <Navigate to='/admin/system/users' />,
          },
          {
            path: 'users',
            element: <UserListPage />,
          },
          {
            path: 'roles',
            element: <RoleListPage />,
          },
          {
            path: 'accesses',
            element: <AccessListPage />,
          },
        ],
      },
    ],
  },
]

export default routes

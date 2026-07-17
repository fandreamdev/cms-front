# React 项目路由完整指南

## 1. 文档目标

路由负责建立 URL 与页面、数据和布局之间的映射。一个生产级 React 项目的路由通常不只是“点击菜单切换组件”，还需要处理：

- 页面路径；
- 嵌套布局；
- 动态参数；
- 查询参数；
- 登录和权限；
- 数据预加载；
- 懒加载和代码分割；
- 重定向；
- 404 和错误边界；
- 表单提交；
- SSR、SSG 和 React Server Components；
- 滚动恢复；
- 离开页面确认；
- 面包屑和导航菜单；
- 自动化测试；
- Web 服务器部署配置。

本文不针对某个具体项目，重点说明不同类型 React 项目如何选择和实现路由。

## 2. 生产使用频率说明

本文使用定性标记描述生产使用情况：

| 标记  | 含义                                         |
| ----- | -------------------------------------------- |
| ★★★★★ | React 对应领域中的主流首选，生产使用非常广泛 |
| ★★★★☆ | 生产中非常常见，生态和实践成熟               |
| ★★★☆☆ | 使用较多，但有明确适用范围                   |
| ★★☆☆☆ | 特定团队或特定应用类型使用                   |
| ★☆☆☆☆ | 小众、历史方案或特殊需求                     |

这些标记不是精确市场占比。不同方案服务的项目类型不同，例如 React Router 主要覆盖通用 SPA，Next.js App Router 主要覆盖 React 全栈、SSR 和 RSC 项目，不能只按下载量直接比较。

## 3. 主流路由方案总览

| 方案                        | 项目类型                           | 路由定义方式            | 生产频率            |
| --------------------------- | ---------------------------------- | ----------------------- | ------------------- |
| React Router                | 通用 React SPA、数据路由、框架模式 | JSX、对象配置、文件约定 | ★★★★★               |
| Next.js App Router          | React 全栈、SSR、SSG、RSC          | 文件系统路由            | ★★★★★               |
| TanStack Router             | TypeScript SPA、强类型路由         | 文件路由、代码路由      | ★★★☆☆               |
| React Router Framework Mode | 全栈 React、SSR、数据加载          | 文件约定                | ★★★★☆               |
| Expo Router                 | React Native、Expo Web             | 文件系统路由            | ★★★★☆，限 Expo 生态 |
| Wouter                      | 极简小型 SPA                       | JSX                     | ★★☆☆☆               |
| Gatsby 路由                 | 内容站、已有 Gatsby 项目           | 文件系统路由            | ★★☆☆☆               |

生产中使用最多的两大方向是：

1. 普通 React SPA 使用 React Router；
2. 需要 SSR、SSG、SEO、React Server Components 或全栈能力时使用 Next.js App Router。

TanStack Router 在重视 TypeScript 路径参数和查询参数类型安全的团队中使用越来越多，但总体存量和生态规模通常仍小于 React Router 和 Next.js。

## 4. 路由的核心组成

一个路由通常包括：

```ts
interface RouteConcept {
  path: string
  component: React.ComponentType
  layout?: React.ComponentType
  loader?: () => Promise<unknown>
  action?: () => Promise<unknown>
  errorComponent?: React.ComponentType
  children?: RouteConcept[]
}
```

URL 可以拆分为：

```text
https://example.com/products/keyboard?sort=price&page=2#reviews
│                    │                  │                 │
origin               pathname           search            hash
```

其中：

- `/products/keyboard` 是路径；
- `keyboard` 可以是动态路径参数；
- `sort=price&page=2` 是查询参数；
- `reviews` 是 Hash；
- 路由状态还可能包含只存在于浏览器历史记录中的 `location.state`。

## 5. 路由定义方式

### 5.1 JSX 声明式路由

生产频率：★★★★☆。

适合传统 React Router SPA 和路由规模较小的应用。

```tsx
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/products" element={<ProductListPage />} />
  <Route path="/products/:productId" element={<ProductDetailPage />} />
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

优点：

- 直观；
- 与 React 组件写法一致；
- 小项目容易理解。

缺点：

- 大型项目路由文件容易变长；
- 路径类型通常需要手动维护；
- 数据加载和代码分割配置可能分散。

### 5.2 对象配置路由

生产频率：★★★★☆。

适合 React Router Data Router。

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        loader: productListLoader,
        element: <ProductListPage />,
      },
      {
        path: 'products/:productId',
        loader: productDetailLoader,
        element: <ProductDetailPage />,
      },
    ],
  },
])
```

优点：

- 路由、Loader、Action 和错误边界集中；
- 适合数据路由；
- 便于遍历路由配置。

### 5.3 文件系统路由

生产频率：★★★★★，尤其在 Next.js 和现代全栈 React 框架中。

文件结构决定 URL：

```text
app/
  page.tsx                    /
  products/
    page.tsx                  /products
    [productId]/
      page.tsx                /products/:productId
```

优点：

- 路由与页面目录一致；
- 自动代码分割；
- 容易定位页面；
- 框架可自动生成类型和服务端入口。

缺点：

- 文件命名受框架约定限制；
- 复杂布局和路径分组需要理解框架规则；
- 路由元数据不一定集中。

## 6. React Router：普通 SPA 的主流方案

### 使用频率

★★★★★。对于使用 Vite、Create React App 或自定义构建工具的普通 React SPA，React Router 是最常见选择。

### 6.1 安装

```bash
npm install react-router-dom
```

### 6.2 最小配置

```tsx
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/products">商品</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### 6.3 BrowserRouter 和 HashRouter

`BrowserRouter` 使用正常路径：

```text
https://example.com/products/123
```

`HashRouter` 使用 Hash：

```text
https://example.com/#/products/123
```

生产选择：

- 正常 Web 项目优先使用 `BrowserRouter`；
- 无法配置服务器回退规则的纯静态环境可使用 `HashRouter`；
- 新项目不应仅为了省略服务器配置就默认选择 Hash 路由。

## 7. React Router Data Router

### 使用频率

★★★★☆。新建 React Router 项目中推荐优先考虑数据路由能力。

### 7.1 创建 Router

```tsx
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <RootErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        loader: async () => {
          const response = await fetch('/api/products')
          if (!response.ok) throw new Response('加载失败', { status: response.status })
          return response.json()
        },
        element: <ProductListPage />,
      },
    ],
  },
])

root.render(<RouterProvider router={router} />)
```

### 7.2 读取 Loader 数据

```tsx
import { useLoaderData } from 'react-router-dom'

function ProductListPage() {
  const products = useLoaderData() as Product[]

  return products.map((product) => <div key={product.id}>{product.name}</div>)
}
```

### 7.3 Loader 和 TanStack Query

Loader 适合在路由进入前准备数据，TanStack Query 适合管理缓存、失效和后台刷新。两者可以组合：

```tsx
const productQuery = (productId: string) => ({
  queryKey: ['product', productId],
  queryFn: () => getProduct(productId),
})

const productLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    const productId = params.productId!
    await queryClient.ensureQueryData(productQuery(productId))
    return { productId }
  }
```

页面继续使用 Query Cache：

```tsx
function ProductDetailPage() {
  const { productId } = useLoaderData() as { productId: string }
  const { data: product } = useQuery(productQuery(productId))

  return <h1>{product.name}</h1>
}
```

这样可以同时得到：

- 路由进入前的数据准备；
- Query Cache；
- 后台刷新；
- 缓存失效；
- 请求去重。

## 8. Next.js App Router

### 使用频率

★★★★★。需要 SSR、SSG、SEO、React Server Components 和全栈能力时，是生产中最常见的 React 路由方案之一。

### 8.1 文件路由

```text
app/
  layout.tsx
  page.tsx
  products/
    page.tsx
    [productId]/
      page.tsx
      loading.tsx
      error.tsx
      not-found.tsx
```

### 8.2 根布局

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Header />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### 8.3 服务端页面

```tsx
export default async function ProductPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const product = await getProduct(productId)

  return <h1>{product.name}</h1>
}
```

### 8.4 客户端导航

```tsx
import Link from 'next/link'

export function ProductLink({ product }: { product: Product }) {
  return <Link href={`/products/${product.id}`}>{product.name}</Link>
}
```

程序式导航需要客户端组件：

```tsx
'use client'

import { useRouter } from 'next/navigation'

export function CreateButton() {
  const router = useRouter()

  return <button onClick={() => router.push('/products/new')}>新增商品</button>
}
```

### 8.5 路由级加载和错误状态

`loading.tsx`：

```tsx
export default function Loading() {
  return <ProductSkeleton />
}
```

`error.tsx`：

```tsx
'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <p>{error.message}</p>
      <button onClick={reset}>重试</button>
    </div>
  )
}
```

Next.js App Router 不只是客户端路由库，而是包含服务端渲染、数据获取、缓存、构建和部署约定的 React 框架。

## 9. React Router Framework Mode

### 使用频率

★★★★☆。适合希望使用 React Router 全栈数据约定、SSR 和路由模块的项目。

典型路由模块：

```tsx
export async function loader({ params }: Route.LoaderArgs) {
  return {
    product: await getProduct(params.productId),
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData()
  await updateProduct(params.productId, {
    name: String(formData.get('name')),
  })

  return redirect(`/products/${params.productId}`)
}

export default function ProductRoute({ loaderData }: Route.ComponentProps) {
  return <ProductEditor product={loaderData.product} />
}
```

它适合：

- 希望路由同时负责 Loader 和 Action；
- 需要渐进增强表单；
- 需要 SSR；
- 喜欢 Web 标准 Request、Response 和 FormData；
- 不需要 Next.js 全部约定的项目。

## 10. TanStack Router

### 使用频率

★★★☆☆。在 TypeScript 优先、重视路径参数和 Search Params 类型安全的 SPA 中较常见。

### 10.1 安装

```bash
npm install @tanstack/react-router
```

通常配合 Vite 插件生成路由树。

### 10.2 文件路由示例

```text
src/routes/
  __root.tsx
  index.tsx
  products/
    index.tsx
    $productId.tsx
```

根路由：

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <nav>
        <Link to="/">首页</Link>
        <Link to="/products">商品</Link>
      </nav>
      <Outlet />
    </>
  ),
})
```

动态路由：

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  loader: ({ params }) => getProduct(params.productId),
  component: ProductPage,
})

function ProductPage() {
  const product = Route.useLoaderData()
  return <h1>{product.name}</h1>
}
```

### 10.3 类型安全 Search Params

```tsx
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  keyword: z.string().catch(''),
  sort: z.enum(['name', 'price']).catch('name'),
})

export const Route = createFileRoute('/products/')({
  validateSearch: productSearchSchema,
  component: ProductListPage,
})

function ProductListPage() {
  const search = Route.useSearch()

  // page、keyword、sort 都有明确类型
  return <div>第 {search.page} 页</div>
}
```

### TanStack Router 优势

- 路径和导航参数类型安全；
- Search Params 验证能力强；
- 与 TanStack Query 配合自然；
- 文件路由和代码路由都可用；
- TypeScript 重构体验优秀。

### 限制

- 团队学习成本高于传统 React Router；
- 生态和历史项目数量通常小于 React Router；
- 生成路由树需要构建插件和约定。

## 11. 静态路由

静态路由是固定路径：

```tsx
<Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
```

适合首页、关于、联系、帮助中心等固定页面。

导航：

```tsx
<Link to="/about">关于我们</Link>
```

不要使用普通 `<a>` 完成同站 SPA 导航：

```tsx
// 会导致整页刷新
<a href="/about">关于我们</a>
```

外部链接、文件下载和确实需要完整页面加载时仍应使用 `<a>`。

## 12. 动态路径参数

### 使用频率

★★★★★。详情页和嵌套资源中最常用。

路由：

```tsx
<Route path="/products/:productId" element={<ProductDetailPage />} />
```

读取：

```tsx
function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>()

  if (!productId) return <NotFoundPage />

  return <ProductDetails productId={productId} />
}
```

多个参数：

```text
/organizations/:organizationId/projects/:projectId
```

URL 示例：

```text
/organizations/acme/projects/cms
```

原则：

- 路径参数用于定位资源；
- 参数应稳定且可编码；
- 不应把完整 JSON 塞进路径；
- 对字符串 ID、UUID 和数字 ID 做运行时校验。

## 13. 查询参数 Search Params

### 使用频率

★★★★★。搜索、筛选、排序和分页的标准方案。

```tsx
function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const keyword = searchParams.get('keyword') ?? ''
  const status = searchParams.get('status') ?? 'all'

  const updateKeyword = (value: string) => {
    setSearchParams({
      page: '1',
      keyword: value,
      status,
    })
  }

  return <SearchForm keyword={keyword} onKeywordChange={updateKeyword} />
}
```

查询参数适合：

- 页码；
- 每页数量；
- 搜索词；
- 排序；
- 多选筛选；
- 当前 Tab；
- 页面视图模式。

优势：

- 刷新后保留；
- 可复制分享；
- 支持前进和后退；
- 可以直接作为查询缓存 Key；
- 服务端渲染时也能读取。

## 14. Hash

Hash 适合页面内部锚点：

```text
/docs/routing#authentication
```

HTML：

```tsx
<section id="authentication">
  <h2>权限路由</h2>
</section>
```

链接：

```tsx
<a href="#authentication">跳到权限路由</a>
```

Hash 不适合作为复杂业务状态的主要存储位置。除非使用 HashRouter，否则应优先使用正常路径和 Search Params。

## 15. 嵌套路由与布局

### 使用频率

★★★★★。后台、控制台、文档站和商城都常用。

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'dashboard',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHome /> },
          { path: 'users', element: <UserListPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
])
```

布局通过 `Outlet` 渲染子页面：

```tsx
function DashboardLayout() {
  return (
    <div className="dashboard">
      <Sidebar />
      <main>
        <Outlet />
      </main>
    </div>
  )
}
```

不要在每个页面重复 Header、Sidebar 和 Footer。

## 16. Index Route

Index Route 是父路径的默认子页面：

```tsx
{
  path: 'dashboard',
  element: <DashboardLayout />,
  children: [
    {
      index: true,
      element: <DashboardOverview />,
    },
    {
      path: 'reports',
      element: <ReportsPage />,
    },
  ],
}
```

访问 `/dashboard` 时渲染 `DashboardOverview`。

## 17. 程序式导航

### 使用频率

★★★★★。

React Router：

```tsx
function LoginForm() {
  const navigate = useNavigate()

  const submit = async (values: LoginPayload) => {
    await login(values)
    navigate('/dashboard', { replace: true })
  }

  return <LoginFields onSubmit={submit} />
}
```

常见选择：

- 用户点击普通链接：优先 `<Link>`；
- 保存成功后跳转：使用 `navigate`；
- 登录成功后替换登录页：使用 `replace: true`；
- 返回上一页：`navigate(-1)`，但需要考虑用户是否有可返回历史。

不要用：

```ts
window.location.href = '/dashboard'
```

除非确实需要整页刷新、跳往其他站点或退出当前 SPA 运行环境。

## 18. 重定向

React Router 组件重定向：

```tsx
function LegacyProductPage() {
  return <Navigate to="/products" replace />
}
```

Loader 重定向：

```tsx
export async function oldRouteLoader() {
  return redirect('/products')
}
```

服务端重定向通常优于客户端渲染后再跳转，因为：

- 响应更早；
- SEO 更明确；
- 不会短暂显示旧页面；
- HTTP 状态可以表达永久或临时重定向。

## 19. 登录保护路由

### 使用频率

★★★★★。管理后台和用户中心的标准需求。

### 19.1 组件保护

```tsx
function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <FullPageSpinner />

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ redirectTo: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
```

路由：

```tsx
<Route element={<RequireAuth />}>
  <Route path="/account" element={<AccountPage />} />
  <Route path="/orders" element={<OrderListPage />} />
</Route>
```

登录后恢复原地址：

```tsx
const location = useLocation()
const navigate = useNavigate()
const redirectTo = location.state?.redirectTo ?? '/'

await login(values)
navigate(redirectTo, { replace: true })
```

### 19.2 Loader 保护

```tsx
async function protectedLoader({ request }: LoaderFunctionArgs) {
  const user = await getCurrentUser()

  if (!user) {
    const url = new URL(request.url)
    throw redirect(`/login?redirect=${encodeURIComponent(url.pathname + url.search)}`)
  }

  return user
}
```

Loader 保护可以在页面组件渲染前完成验证，通常比组件加载后跳转更稳定。

### 安全说明

客户端保护路由只改善用户体验，不能替代后端鉴权。用户可以手动请求接口，因此服务端必须验证身份和权限。

## 20. 角色和权限路由

### 使用频率

★★★★☆。企业系统和管理后台常见。

```tsx
function RequirePermission({ permission }: { permission: string }) {
  const { user } = useAuth()

  if (!user?.permissions.includes(permission)) {
    return <ForbiddenPage />
  }

  return <Outlet />
}
```

配置：

```tsx
<Route element={<RequirePermission permission="user:list" />}>
  <Route path="/admin/users" element={<UserListPage />} />
</Route>
```

复杂项目可以把权限声明放在路由元数据：

```ts
{
  path: 'users',
  element: <UserListPage />,
  handle: {
    title: '用户管理',
    permission: 'user:list',
  },
}
```

同一份元数据可用于：

- 路由保护；
- 菜单过滤；
- 面包屑；
- 页面标题；
- 审计信息。

但后端仍必须执行真正的权限校验。

## 21. 404 路由

### 使用频率

★★★★★。

```tsx
<Route path="*" element={<NotFoundPage />} />
```

页面：

```tsx
function NotFoundPage() {
  return (
    <main>
      <h1>404</h1>
      <p>页面不存在或已经被移动。</p>
      <Link to="/">返回首页</Link>
    </main>
  )
}
```

需要区分：

- 路由不存在；
- 路由存在但资源不存在；
- 没有权限；
- 服务端异常。

不要把所有错误都跳转到首页，否则用户无法判断问题。

## 22. 路由错误边界

### 使用频率

★★★★☆。数据路由和全栈框架中推荐使用。

React Router：

```tsx
function RouteErrorPage() {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    )
  }

  return <p>页面发生未知错误</p>
}
```

配置：

```tsx
{
  path: 'products/:productId',
  loader: productLoader,
  element: <ProductPage />,
  errorElement: <RouteErrorPage />,
}
```

路由错误边界可以把错误限制在当前布局区域，而不是让整个应用白屏。

## 23. 懒加载和代码分割

### 使用频率

★★★★★。生产 SPA 的标准实践。

React 原生：

```tsx
const ProductPage = lazy(() => import('./pages/ProductPage'))

function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/products/:productId" element={<ProductPage />} />
      </Routes>
    </Suspense>
  )
}
```

React Router Lazy Route：

```tsx
{
  path: 'products/:productId',
  lazy: async () => {
    const module = await import('./routes/ProductRoute')
    return {
      Component: module.ProductPage,
      loader: module.loader,
      ErrorBoundary: module.ErrorBoundary,
    }
  },
}
```

按路由拆包可以避免首页加载所有页面代码。

不要把每个极小组件都拆成单独 Chunk。代码分割应优先按照页面、业务模块和大型依赖进行。

## 24. 路由数据预加载

用户鼠标悬停链接时可以预加载页面代码或数据。

框架可能自动处理，也可以手动实现：

```tsx
function ProductLink({ productId, name }: ProductLinkProps) {
  const queryClient = useQueryClient()

  return (
    <Link
      to={`/products/${productId}`}
      onMouseEnter={() => {
        void queryClient.prefetchQuery(productQuery(productId))
      }}
    >
      {name}
    </Link>
  )
}
```

预加载适合高概率访问的下一页面，不应在列表中无条件预加载成千上万个详情。

## 25. 表单 Action 和路由

React Router Data Router 可以让路由处理表单提交：

```tsx
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()

  const product = await createProduct({
    name: String(formData.get('name')),
    price: Number(formData.get('price')),
  })

  return redirect(`/products/${product.id}`)
}
```

组件：

```tsx
function CreateProductPage() {
  const navigation = useNavigation()

  return (
    <Form method="post">
      <input name="name" />
      <input name="price" type="number" />
      <button disabled={navigation.state === 'submitting'}>创建</button>
    </Form>
  )
}
```

该方案适合：

- 需要渐进增强；
- 希望表单与路由生命周期统一；
- 使用 SSR 或 Framework Mode；
- 希望减少组件内手写提交状态。

## 26. 模态框路由

### 使用频率

★★★☆☆。图片预览、详情浮层和社交应用常见。

需求：

- 从列表点击详情时以 Modal 展示；
- URL 仍变成 `/products/123`；
- 复制该 URL 直接打开时显示完整详情页；
- 关闭 Modal 返回列表 URL。

React Router 可以使用 Background Location：

```tsx
function AppRoutes() {
  const location = useLocation()
  const state = location.state as { backgroundLocation?: Location }

  return (
    <>
      <Routes location={state?.backgroundLocation || location}>
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>

      {state?.backgroundLocation && (
        <Routes>
          <Route path="/products/:productId" element={<ProductDetailModal />} />
        </Routes>
      )}
    </>
  )
}
```

列表链接：

```tsx
<Link to={`/products/${product.id}`} state={{ backgroundLocation: location }}>
  查看详情
</Link>
```

此模式需要认真处理刷新、前进后退和直接访问。

## 27. 面包屑

### 使用频率

★★★★☆。后台、文档和多层级网站常见。

使用路由元数据：

```tsx
const routes = [
  {
    path: 'products',
    element: <ProductLayout />,
    handle: { crumb: () => <Link to="/products">商品</Link> },
    children: [
      {
        path: ':productId',
        loader: productLoader,
        element: <ProductPage />,
        handle: {
          crumb: (data: Product) => data.name,
        },
      },
    ],
  },
]
```

渲染：

```tsx
function Breadcrumbs() {
  const matches = useMatches()
  const crumbs = matches
    .filter((match) => match.handle?.crumb)
    .map((match) => match.handle.crumb(match.data))

  return (
    <nav>
      {crumbs.map((crumb, index) => (
        <span key={index}>{crumb}</span>
      ))}
    </nav>
  )
}
```

不要仅按 URL 字符串切割生成面包屑，因为动态 ID 通常需要显示资源名称。

## 28. 页面标题和元数据

路由切换时应更新页面标题。

简单 SPA：

```tsx
function ProductPage({ product }: { product: Product }) {
  useEffect(() => {
    document.title = `${product.name} - 商城`
  }, [product.name])

  return <h1>{product.name}</h1>
}
```

框架项目优先使用框架元数据 API。Next.js：

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { productId } = await params
  const product = await getProduct(productId)

  return {
    title: product.name,
    description: product.summary,
  }
}
```

需要 SEO 的页面不应只依赖客户端 `useEffect` 设置元数据。

## 29. 滚动恢复

### 使用频率

★★★★☆。

React Router Data Router：

```tsx
function RootLayout() {
  return (
    <>
      <Outlet />
      <ScrollRestoration />
    </>
  )
}
```

常见策略：

- 新页面滚动到顶部；
- 浏览器后退时恢复列表滚动位置；
- Hash 导航滚动到对应元素；
- Modal Route 不应意外重置背景列表位置。

不要在每次 Location 变化时无条件执行 `window.scrollTo(0, 0)`，这可能破坏浏览器返回时的滚动恢复。

## 30. 离开页面确认

### 使用频率

★★★☆☆。编辑器和长表单常见。

需要处理两种情况：

1. SPA 内部路由跳转；
2. 刷新、关闭标签页或访问外部网站。

浏览器离开：

```tsx
useEffect(() => {
  if (!isDirty) return

  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    event.preventDefault()
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

内部跳转应使用路由库提供的 Blocker API。不要依赖自定义提示文本，现代浏览器通常显示自己的统一确认文案。

## 31. 路由级数据缓存

路由 Loader 与缓存库需要明确职责：

```text
Router Loader
  ├─ 决定进入页面前需要什么
  ├─ 负责重定向和路由级错误
  └─ 可以预热 Query Cache

TanStack Query / RTK Query
  ├─ 缓存
  ├─ 过期
  ├─ 后台刷新
  ├─ Mutation
  └─ 跨组件共享服务端数据
```

不要同时在 Loader 返回完整数据、组件 State 和 Query Cache 中保存三份相同数据。

推荐让 Loader 预热 Query Cache，组件统一从 Query Cache 订阅。

## 32. 路由与状态管理

以下状态应该优先放在 URL：

- 搜索；
- 分页；
- 排序；
- 筛选；
- 当前 Tab；
- 当前资源；
- 可分享的页面视图。

以下状态通常不放 URL：

- 鼠标坐标；
- 弹窗动画进度；
- 密码输入；
- 临时上传对象；
- 不适合暴露的敏感信息；
- 纯组件内部状态。

不要在 Redux、Zustand 和 URL 中同时维护一份分页状态。URL 应作为分页和筛选的唯一数据源，Query Key 从 URL 派生。

## 33. 类型安全路由

### 使用频率

★★★★☆。TypeScript 项目越来越重视。

常见实现：

- TanStack Router 自动生成路由类型；
- Next.js 文件路由配合框架类型；
- React Router 使用类型生成或集中路径函数；
- 自己维护 Path Builder。

路径函数示例：

```ts
export const paths = {
  home: () => '/',
  products: () => '/products',
  productDetail: (productId: string) => `/products/${encodeURIComponent(productId)}`,
  organizationProject: (organizationId: string, projectId: string) =>
    `/organizations/${encodeURIComponent(organizationId)}/projects/${encodeURIComponent(projectId)}`,
}
```

使用：

```tsx
<Link to={paths.productDetail(product.id)}>{product.name}</Link>
```

这比在各处重复拼接字符串更容易重构。

## 34. 路由参数运行时校验

TypeScript 类型不能验证地址栏中的实际字符串。

```tsx
const productSearchSchema = z.object({
  page: z.coerce.number().int().positive().catch(1),
  pageSize: z.coerce.number().int().min(10).max(100).catch(20),
  status: z.enum(['active', 'inactive']).optional(),
})

const parsed = productSearchSchema.parse(Object.fromEntries(new URLSearchParams(location.search)))
```

路径 ID 也需要检查：

```tsx
const id = Number(params.productId)

if (!Number.isInteger(id) || id <= 0) {
  throw new Response('Invalid product id', { status: 400 })
}
```

## 35. 国际化路由

### 使用频率

★★★☆☆。国际化内容站和跨国业务常见。

常见路径：

```text
/zh-CN/products
/en-US/products
```

路由：

```tsx
<Route path="/:locale/products" element={<ProductListPage />} />
```

校验：

```tsx
const supportedLocales = ['zh-CN', 'en-US'] as const

function isSupportedLocale(value: string): value is (typeof supportedLocales)[number] {
  return supportedLocales.includes(value as (typeof supportedLocales)[number])
}
```

需要决定：

- 默认语言是否包含前缀；
- 不支持语言如何重定向；
- SEO `hreflang`；
- Cookie、浏览器语言和 URL 的优先级；
- 翻译内容是否由服务端预加载。

## 36. 多租户路由

### 使用频率

★★★☆☆。SaaS 平台常见。

路径租户：

```text
/organizations/acme/dashboard
```

子域名租户：

```text
https://acme.example.com/dashboard
```

路径方案更容易在普通 SPA 中实现：

```tsx
<Route path="/organizations/:organizationId" element={<OrganizationLayout />}>
  <Route path="dashboard" element={<DashboardPage />} />
  <Route path="members" element={<MemberListPage />} />
</Route>
```

切换租户时应：

- 更新 URL；
- 清理或区分服务端缓存；
- 重新检查权限；
- 防止上一个租户的数据短暂显示；
- Query Key 包含租户 ID。

```tsx
queryKey: ['organization', organizationId, 'members']
```

## 37. 路由分组

文件路由框架通常支持不影响 URL 的目录分组。

Next.js：

```text
app/
  (marketing)/
    about/page.tsx
  (dashboard)/
    settings/page.tsx
```

URL 仍然是：

```text
/about
/settings
```

分组用于：

- 不同布局；
- 代码组织；
- 不同认证范围；
- 市场页面和后台页面分离。

## 38. 可选路径和通配路径

通配路由：

```tsx
<Route path="/docs/*" element={<DocsLayout />} />
```

读取剩余路径：

```tsx
const params = useParams()
const remainingPath = params['*']
```

使用场景：

- 文档目录；
- 文件浏览器；
- CMS 自定义页面路径；
- 兼容旧路径。

通配路由应放在更具体路由之后或依赖路由库的优先级算法，避免意外吞掉其他页面。

## 39. 微前端路由

### 使用频率

★★☆☆☆。大型组织和独立部署团队使用。

常见模式：

```text
主应用 Router
  ├─ /account/*      账户子应用
  ├─ /orders/*       订单子应用
  └─ /analytics/*    数据分析子应用
```

需要明确：

- 谁拥有浏览器 History；
- 子应用使用绝对路径还是基路径；
- 主应用如何处理 404；
- 登录和权限如何共享；
- 子应用跳转其他子应用的协议；
- 部署环境的 Base URL；
- 路由事件和埋点。

通常只允许主应用控制顶层路由，子应用控制自己的子路径，避免多个 Router 同时竞争 `window.history`。

## 40. 路由埋点

### 使用频率

★★★★☆。生产应用通常需要页面访问分析。

```tsx
function RouteAnalytics() {
  const location = useLocation()

  useEffect(() => {
    analytics.pageView({
      path: location.pathname,
      search: location.search,
    })
  }, [location.pathname, location.search])

  return null
}
```

注意：

- 排除敏感 Search 参数；
- 动态 ID 可归一化为路由模板；
- 避免 Suspense 或重定向造成重复上报；
- SSR 项目区分服务端和客户端 Page View。

## 41. 路由测试

### 使用频率

★★★★☆。关键流程应有路由测试。

React Router 使用 MemoryRouter：

```tsx
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

test('renders product id from route', () => {
  render(
    <MemoryRouter initialEntries={['/products/p100']}>
      <Routes>
        <Route path="/products/:productId" element={<ProductDetailPage />} />
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.getByText('p100')).toBeInTheDocument()
})
```

测试保护路由：

```tsx
test('redirects anonymous user to login', async () => {
  renderApp({
    initialPath: '/account',
    user: null,
  })

  expect(await screen.findByRole('heading', { name: '登录' })).toBeInTheDocument()
})
```

端到端测试应覆盖：

- 直接访问深层 URL；
- 刷新页面；
- 登录后回跳；
- 浏览器前进和后退；
- 404；
- 无权限；
- Search 参数恢复；
- 未保存表单阻止离开；
- 懒加载失败。

## 42. BrowserRouter 部署配置

### 使用频率

★★★★★。SPA 上线必须正确配置。

访问：

```text
https://example.com/products/123
```

浏览器刷新时，Web 服务器会直接请求 `/products/123`。服务器必须把未知前端路径回退到 `index.html`。

Nginx：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

Apache：

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

静态托管平台通常有 Redirect 或 Rewrite 配置。

必须确保：

- `/api/*` 不回退到 `index.html`；
- 静态资源真实 404 不被错误返回 HTML；
- CDN 缓存规则不会把所有路由缓存成同一错误响应；
- Base Path 与构建资源路径一致。

## 43. Base Path 部署

应用可能部署在：

```text
https://example.com/admin/
```

React Router：

```tsx
<BrowserRouter basename="/admin">
  <App />
</BrowserRouter>
```

Vite 还需要配置资源 Base：

```ts
export default defineConfig({
  base: '/admin/',
})
```

路由 Base 和静态资源 Base 是两个相关但不同的问题，必须同时验证。

## 44. SSR、SSG 和 CSR 路由选择

### CSR

浏览器下载 JavaScript 后生成页面。

适合：

- 管理后台；
- 登录后的工具；
- SEO 不重要；
- 强交互应用。

常用方案：

- React Router；
- TanStack Router。

### SSR

每次请求由服务器生成 HTML。

适合：

- SEO；
- 个性化首屏；
- 需要较快首屏内容；
- 服务端权限和重定向。

常用方案：

- Next.js App Router；
- React Router Framework Mode；
- 支持 SSR 的 TanStack Router 框架方案。

### SSG

构建时生成静态 HTML。

适合：

- 文档；
- 博客；
- 营销页面；
- 内容更新频率较低。

常用方案：

- Next.js；
- Astro 中嵌入 React；
- Gatsby 存量项目。

选择路由方案时应先决定渲染架构，而不是只比较 Router Hook API。

## 45. SEO 与路由

需要 SEO 时应考虑：

- 服务端或构建时输出正文；
- 每个 URL 有独立 Title 和 Description；
- Canonical URL；
- Open Graph；
- Sitemap；
- 真实 HTTP 404；
- 永久重定向使用 301/308；
- 临时重定向使用 302/307；
- 页面内容不应只在客户端 Effect 后出现；
- Search 参数页面是否允许索引。

单纯安装 React Router 不会自动解决 SEO。

## 46. 路由命名原则

推荐：

```text
/products
/products/:productId
/products/:productId/edit
/organizations/:organizationId/members
```

避免：

```text
/getProductList
/productDetailPage?id=1
/doEditProduct/1
```

建议：

- URL 表达资源和页面，不表达前端组件名；
- 使用名词而不是接口方法名；
- 路径风格保持一致；
- 资源 ID 使用路径参数；
- 筛选和排序使用 Search 参数；
- 不把敏感信息放 URL；
- 已公开 URL 改动时提供重定向。

## 47. 菜单与路由分离

不是所有路由都应显示在菜单中：

- 登录页；
- 详情页；
- 编辑页；
- 404；
- 回调页；
- Modal Route；
- 隐藏的权限页面。

菜单可以引用路由元数据，但不要假设菜单数组就是完整路由表。

```ts
interface NavigationItem {
  label: string
  to: string
  icon?: ReactNode
  permission?: string
}
```

路由负责页面匹配，菜单负责导航展示，两者职责不同。

## 48. 常见反模式

### 48.1 使用 useState 模拟完整路由

```tsx
const [currentPage, setCurrentPage] = useState('home')
```

问题：

- 刷新丢失；
- 不能分享；
- 不支持浏览器历史；
- 无法直接访问详情。

### 48.2 所有导航使用 window.location

会造成整页刷新并丢失 SPA 内存状态。

### 48.3 在组件渲染过程中导航

```tsx
if (!user) {
  navigate('/login')
}
```

应使用路由 Loader、重定向组件或 Effect，避免渲染期间产生副作用。

### 48.4 把服务端鉴权等同于客户端保护

隐藏路由和按钮不能阻止接口被直接调用。

### 48.5 分页同时保存在 URL 和全局 Store

双数据源容易不一致。可分享分页应以 URL 为准。

### 48.6 每个路由都进入主 Bundle

大型项目应按路由懒加载。

### 48.7 捕获所有错误后重定向首页

用户无法区分 404、403 和服务器错误，也不利于排查。

### 48.8 Search 参数不校验

地址栏是外部输入，必须提供默认值、范围和枚举校验。

### 48.9 菜单路径和路由路径各写一套字符串

容易在重构后失配，应使用路径函数、路由类型或元数据。

## 49. 生产中使用最多的方案

### 第一梯队

#### React Router

生产频率：★★★★★。

适合：

- 通用 React SPA；
- Vite 项目；
- 管理后台；
- 用户中心；
- 不需要完整 Next.js 框架的应用。

最频繁使用的能力：

- `Link`；
- `useNavigate`；
- `useParams`；
- `useSearchParams`；
- 嵌套路由和 `Outlet`；
- 保护路由；
- 懒加载；
- Data Router Loader。

#### Next.js App Router

生产频率：★★★★★。

适合：

- React 全栈项目；
- SSR、SSG；
- SEO；
- React Server Components；
- 内容和电商网站；
- 希望采用完整框架约定。

最频繁使用的能力：

- `app` 文件路由；
- `layout.tsx`；
- 动态目录 `[id]`；
- `Link`；
- Server Component 数据加载；
- `loading.tsx`；
- `error.tsx`；
- Metadata。

### 第二梯队

#### React Router Framework Mode

生产频率：★★★★☆。

适合偏好 Web 标准 Loader、Action、Form、SSR 和渐进增强的全栈 React 团队。

#### TanStack Router

生产频率：★★★☆☆。

适合：

- TypeScript 优先；
- Search Params 复杂；
- 重视端到端类型安全；
- 大量使用 TanStack Query；
- 愿意采用路由代码生成。

### 特定生态

- Expo Router：React Native 和 Expo 项目的主流文件路由之一；
- Apollo Router 概念不等同于 React 页面路由，GraphQL Client 仍需搭配页面 Router；
- Wouter：超轻量小应用；
- Gatsby：已有内容站和存量项目。

## 50. 常见生产组合

### 50.1 普通后台 SPA

```text
Vite
React Router Data Router
TanStack Query
React Hook Form
```

路由负责：

- 页面和布局；
- 参数；
- 权限入口；
- Loader 预热；
- 404 和错误边界。

Query 负责服务端缓存。

### 50.2 大型 Redux SPA

```text
React Router
Redux Toolkit
RTK Query
```

适合已有 Redux 规范的大型团队。

### 50.3 类型安全 SPA

```text
TanStack Router
TanStack Query
Zod
```

适合复杂 Search 参数和强 TypeScript 项目。

### 50.4 SEO 和全栈 React

```text
Next.js App Router
React Server Components
Server Actions 或 API
```

### 50.5 Web 标准全栈 React

```text
React Router Framework Mode
Loader
Action
Form
SSR
```

### 50.6 React Native

```text
Expo Router
React Navigation
```

Expo Router 建立在 React Navigation 生态之上，使用文件系统组织页面。

## 51. 项目规模选型

### 小型静态 SPA

推荐：

- React Router 声明式路由；
- 页面级 Lazy；
- 简单 404。

不需要为了类型生成引入复杂构建流程。

### 中型业务 SPA

推荐：

- React Router Data Router；
- 嵌套布局；
- Loader；
- TanStack Query；
- URL Search Params；
- 路由错误边界。

### TypeScript 强类型 SPA

推荐：

- TanStack Router；
- Search Schema；
- TanStack Query；
- 文件路由生成。

### SEO 或全栈应用

推荐优先比较：

- Next.js App Router；
- React Router Framework Mode。

### 内容和营销站

推荐：

- Next.js；
- Astro 配合 React；
- 已使用 Gatsby 的项目可以继续维护，但新项目应重新评估。

## 52. 添加路由的标准实施步骤

### 步骤一：确定渲染架构

确认项目属于：

- CSR SPA；
- SSR；
- SSG；
- React Server Components；
- React Native。

### 步骤二：选择 Router

一般选择：

```text
普通 SPA                  React Router
TypeScript 强类型 SPA     TanStack Router
全栈、SSR、RSC            Next.js App Router
Web 标准全栈 React        React Router Framework Mode
Expo                      Expo Router
```

### 步骤三：设计 URL

先写出路径：

```text
/
/products
/products/:productId
/products/:productId/edit
/account/orders?page=1
```

明确哪些是 Path Param，哪些是 Search Param。

### 步骤四：设计布局树

```text
RootLayout
├─ MarketingLayout
│  ├─ Home
│  └─ About
└─ DashboardLayout
   ├─ Overview
   ├─ Products
   └─ Settings
```

### 步骤五：添加认证和权限边界

明确：

- 哪些页面公开；
- 哪些需要登录；
- 哪些需要权限；
- 未登录跳转地址；
- 无权限显示 403 还是隐藏入口。

### 步骤六：配置数据加载

选择：

- 组件 Query；
- Router Loader；
- Loader 预热 Query Cache；
- Server Component；
- SSR Loader。

### 步骤七：配置错误和加载状态

每个关键布局应考虑：

- Loading；
- 404；
- 403；
- 500；
- Chunk 加载失败；
- 数据不存在。

### 步骤八：配置代码分割

大型页面按路由 Lazy Load。

### 步骤九：配置部署回退

BrowserRouter SPA 必须配置服务器 Rewrite。

### 步骤十：测试

至少验证：

- 菜单导航；
- 直接访问；
- 刷新；
- 参数；
- Search；
- 登录回跳；
- 权限；
- 404；
- 前进后退；
- 懒加载。

## 53. 路由验收清单

### 基础导航

- 所有公开 URL 可以直接访问；
- 点击链接不会整页刷新；
- 浏览器前进后退正确；
- 当前菜单和面包屑正确；
- 页面标题正确。

### 参数

- 动态参数经过校验；
- Search 参数有默认值和范围；
- 特殊字符正确编码；
- 无效参数有明确行为。

### 权限

- 未登录用户被正确重定向；
- 登录后恢复目标页面；
- 无权限用户看到 403 或被正确引导；
- 后端仍执行权限校验。

### 数据

- 路由切换没有重复请求；
- Loader 和 Query Cache 没有双份数据；
- 切换租户时缓存隔离；
- 资源不存在返回正确 404。

### 性能

- 页面按路由拆包；
- 高概率页面可合理预加载；
- 首屏没有加载所有后台模块；
- Chunk 加载失败可以恢复。

### 部署

- 深层 URL 刷新不会返回服务器 404；
- API 不会被 Rewrite 到 `index.html`；
- Base Path 正确；
- 静态资源路径正确；
- CDN 缓存正确。

### 测试

- 路由单元测试通过；
- 登录和权限端到端测试通过；
- Search 参数刷新恢复；
- 编辑表单离开确认生效；
- 404 和错误页可访问。

## 54. 最终建议

大部分 React 项目可以按以下规则选择：

```text
普通 React SPA
  → React Router

TypeScript 类型安全和复杂 Search Params
  → TanStack Router

需要 SSR、SSG、SEO、RSC 和全栈能力
  → Next.js App Router

希望使用 Loader、Action、Form 和 Web 标准全栈模式
  → React Router Framework Mode

React Native / Expo
  → Expo Router
```

在生产中使用最频繁的路由能力通常不是高级技巧，而是：

1. 静态和动态路径；
2. `Link` 和程序式导航；
3. 嵌套布局；
4. Path Params；
5. Search Params；
6. 登录保护；
7. 404 和错误边界；
8. 路由懒加载；
9. URL 与服务端查询缓存配合；
10. BrowserRouter 的部署回退。

路由设计的核心不是把组件与字符串简单对应，而是让 URL 成为页面状态、资源定位、导航历史和数据生命周期的稳定入口。优秀的路由结构应当可直接访问、可刷新、可分享、可测试，并且在权限、错误、加载和部署环境下都有明确行为。

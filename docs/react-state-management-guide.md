# React 项目状态管理完整指南

## 1. 文档目标

React 项目不存在一种能够合理管理所有状态的万能方案。一个完整应用通常同时包含局部 UI 状态、表单状态、服务端数据、URL 状态、登录会话、持久化数据、实时消息和复杂业务流程。

正确的设计方式不是先选择 Redux、Zustand 或其他库，再把所有数据放进去，而是先判断状态的性质、生命周期和共享范围，再选择对应工具。

本文不针对某个具体项目，目标是回答：

- 一个生产项目通常需要管理哪些状态；
- 每种状态应该放在哪里；
- 每种方案的具体写法和适用边界；
- 当前生产环境使用最频繁的方案是什么；
- 不同规模项目如何组合这些方案。

## 2. 使用频率说明

本文使用以下定性标记描述生产使用情况：

| 标记  | 含义                                                  |
| ----- | ----------------------------------------------------- |
| ★★★★★ | 几乎所有 React 项目都会使用，或在对应领域属于主流首选 |
| ★★★★☆ | 生产中非常常见，有大量成熟项目使用                    |
| ★★★☆☆ | 常见但有明确适用范围，通常不是所有项目必需            |
| ★★☆☆☆ | 特定团队、技术栈或业务类型使用较多                    |
| ★☆☆☆☆ | 小众方案、历史方案或只适合特殊场景                    |

这些标记表示工程实践中的相对常见程度，不是精确市场份额。库的流行程度会随团队背景、项目类型和时间变化。

## 3. 状态分类总览

| 状态类型           | 典型例子                       | 推荐方案                        | 生产频率 |
| ------------------ | ------------------------------ | ------------------------------- | -------- |
| 局部 UI 状态       | 弹窗、展开、Tab、选中项        | `useState`                      | ★★★★★    |
| 复杂局部状态       | 多步骤组件、多个关联字段       | `useReducer`                    | ★★★☆☆    |
| 派生状态           | 总价、过滤结果、权限结果       | 直接计算、`useMemo`             | ★★★★★    |
| 跨层低频状态       | 主题、语言、当前用户           | Context                         | ★★★★☆    |
| 全局客户端状态     | 编辑器、购物车、播放器         | Zustand、Redux Toolkit          | ★★★★☆    |
| 服务端查询状态     | 列表、详情、分页、缓存         | TanStack Query、RTK Query       | ★★★★★    |
| GraphQL 服务端状态 | GraphQL 查询、Normalized Cache | Apollo Client、urql             | ★★★☆☆    |
| 表单状态           | 值、校验、Touched、提交        | React Hook Form、组件库 Form    | ★★★★★    |
| URL 状态           | 搜索、分页、排序、Tab          | Router Search Params            | ★★★★★    |
| 持久化状态         | 主题、草稿、离线数据           | LocalStorage、IndexedDB         | ★★★★☆    |
| 异步提交状态       | Pending、成功、失败            | Mutation、React Actions         | ★★★★★    |
| 乐观状态           | 点赞、发消息、列表编辑         | Query Mutation、`useOptimistic` | ★★★☆☆    |
| 实时状态           | WebSocket、在线用户、消息      | Query Cache + Store             | ★★★☆☆    |
| 复杂流程状态       | 支付、审批、上传流程           | 状态机、XState                  | ★★☆☆☆    |
| 非渲染状态         | 定时器、DOM、连接实例          | `useRef`                        | ★★★★★    |
| 跨标签页状态       | 登录退出、共享偏好             | BroadcastChannel、Storage Event | ★★☆☆☆    |

## 4. 判断状态应该放在哪里

可以按以下顺序判断：

1. 这个值能否从已有数据计算出来？能则不保存，直接计算。
2. 这个值是否只影响一个组件？是则使用 `useState` 或 `useReducer`。
3. 这个值是否应体现在地址栏中？是则放入 URL。
4. 这个值是否来自服务器？是则交给服务端状态库。
5. 这个值是否属于表单录入过程？是则交给表单库。
6. 这个值是否只用于保存实例，不影响渲染？是则使用 `useRef`。
7. 这个值是否需要被多个无直接关系的组件共享？是则考虑 Context、Zustand 或 Redux Toolkit。
8. 这个状态是否有严格的合法流转路径？是则考虑 Reducer 或状态机。
9. 这个状态是否需要刷新后保留？是则增加持久化层。

核心原则是让状态位于能够满足需求的最小范围内。

## 5. 局部 UI 状态：useState

### 使用频率

★★★★★，这是 React 项目中使用最频繁的状态方案。

### 适用场景

- 弹窗是否打开；
- 当前 Tab；
- 展开或折叠；
- 当前选中项；
- 临时搜索文本；
- 当前悬停或拖拽状态；
- 简单加载状态。

### 案例

```tsx
import { useState } from 'react'

export function ProductPanel() {
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')

  return (
    <section>
      <button onClick={() => setDetailsOpen((open) => !open)}>
        {detailsOpen ? '收起详情' : '展开详情'}
      </button>

      <button onClick={() => setActiveTab('description')}>商品说明</button>
      <button onClick={() => setActiveTab('reviews')}>用户评价</button>

      {detailsOpen && <div>{activeTab === 'description' ? <Description /> : <Reviews />}</div>}
    </section>
  )
}
```

### 最佳实践

状态依赖旧值时使用函数式更新：

```tsx
setDetailsOpen((open) => !open)
```

不要把所有局部值合并进一个大对象：

```tsx
// 不必要地耦合多个独立状态
const [state, setState] = useState({
  modalOpen: false,
  activeTab: 'home',
  keyword: '',
  selectedId: null,
})
```

独立变化的状态通常应该分开：

```tsx
const [modalOpen, setModalOpen] = useState(false)
const [activeTab, setActiveTab] = useState('home')
const [keyword, setKeyword] = useState('')
```

## 6. 复杂局部状态：useReducer

### 使用频率

★★★☆☆。生产中常见，但通常只在状态转换较复杂时使用。

### 适用场景

- 多个字段必须一起变化；
- 状态转换有明确事件；
- 多步骤向导；
- 局部编辑器；
- 多种操作会修改同一份状态；
- 希望集中测试状态转换。

### 案例

```tsx
import { useReducer } from 'react'

interface CheckoutState {
  step: 'address' | 'payment' | 'confirm'
  address: string
  paymentMethod: 'card' | 'cash' | null
}

type CheckoutAction =
  | { type: 'setAddress'; address: string }
  | { type: 'setPayment'; paymentMethod: 'card' | 'cash' }
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'reset' }

const initialState: CheckoutState = {
  step: 'address',
  address: '',
  paymentMethod: null,
}

function checkoutReducer(state: CheckoutState, action: CheckoutAction): CheckoutState {
  switch (action.type) {
    case 'setAddress':
      return { ...state, address: action.address }
    case 'setPayment':
      return { ...state, paymentMethod: action.paymentMethod }
    case 'next':
      if (state.step === 'address') return { ...state, step: 'payment' }
      if (state.step === 'payment') return { ...state, step: 'confirm' }
      return state
    case 'previous':
      if (state.step === 'confirm') return { ...state, step: 'payment' }
      if (state.step === 'payment') return { ...state, step: 'address' }
      return state
    case 'reset':
      return initialState
  }
}

export function Checkout() {
  const [state, dispatch] = useReducer(checkoutReducer, initialState)

  return (
    <div>
      <p>当前步骤：{state.step}</p>
      <button onClick={() => dispatch({ type: 'previous' })}>上一步</button>
      <button onClick={() => dispatch({ type: 'next' })}>下一步</button>
    </div>
  )
}
```

### 与 Redux 的区别

`useReducer` 默认只属于当前组件树，不会自动形成全局 Store，也没有 Redux DevTools、中间件和全局订阅能力。

## 7. 派生状态：直接计算和 useMemo

### 使用频率

★★★★★。几乎所有项目都需要正确处理派生状态。

派生状态是能够从其他状态计算得到的值，例如：

- 商品总价；
- 过滤后的列表；
- 是否拥有权限；
- 用户全名；
- 表单是否允许提交；
- 未读数量。

### 推荐写法

```tsx
const totalPrice = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
```

计算成本较高时使用 `useMemo`：

```tsx
const visibleProducts = useMemo(
  () =>
    products.filter((product) => product.name.includes(keyword)).sort((a, b) => a.price - b.price),
  [products, keyword],
)
```

### 不推荐的双重状态

```tsx
const [products, setProducts] = useState<Product[]>([])
const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

useEffect(() => {
  setFilteredProducts(products.filter((product) => product.name.includes(keyword)))
}, [products, keyword])
```

这样会制造两份数据源，并产生额外渲染。能计算出来的值通常不应再放入 State。

## 8. 状态提升：共享给少量相邻组件

### 使用频率

★★★★★。这是 React 最基础的共享状态方式。

当兄弟组件需要共享状态时，将状态放到它们最近的共同父组件。

```tsx
function TemperatureInput({ value, onChange }: InputProps) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} />
}

function TemperatureCalculator() {
  const [celsius, setCelsius] = useState('')

  return (
    <>
      <TemperatureInput value={celsius} onChange={setCelsius} />
      <TemperaturePreview celsius={Number(celsius)} />
    </>
  )
}
```

如果只有两三个相邻组件共享状态，状态提升通常比引入全局 Store 更简单。

## 9. 跨层低频共享状态：Context

### 使用频率

★★★★☆。主题、语言、用户会话和依赖注入中非常常见。

### 适用场景

- 当前用户；
- 主题；
- 国际化；
- 权限；
- 应用级配置；
- 服务实例注入。

### 案例

```tsx
import { createContext, useContext, useMemo, useState } from 'react'

interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme 必须在 ThemeProvider 内使用')
  return context
}
```

### Context 的限制

Context 主要解决跨层传递，不是完整的高频全局状态库。Provider 的 Value 改变时，消费它的组件会重新渲染。

以下 Context 过于宽泛：

```tsx
<AppContext.Provider value={{ user, theme, notifications, editor, cart }}>
```

应该按变化频率和职责拆分 Context。高频、大规模共享状态更适合 Zustand、Redux Toolkit 或原子状态库。

## 10. 全局客户端状态：Redux Toolkit

### 使用频率

★★★★☆。在大型应用、企业项目、已有 Redux 技术栈中仍是最主流方案之一。

### 适用场景

- 大型团队需要统一规范；
- 状态变化需要可追踪；
- 需要 Redux DevTools；
- 需要中间件、日志、持久化；
- 多模块共享复杂客户端状态；
- 已经使用 RTK Query。

### Store 配置

```ts
import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface CartItem {
  productId: string
  name: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  couponCode: string | null
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], couponCode: null } as CartState,
  reducers: {
    addItem(state, action: PayloadAction<CartItem>) {
      state.items.push(action.payload)
    },
    changeQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((entry) => entry.productId === action.payload.productId)
      if (item) item.quantity = action.payload.quantity
    },
    applyCoupon(state, action: PayloadAction<string>) {
      state.couponCode = action.payload
    },
  },
})

export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
  },
})

export const { addItem, changeQuantity, applyCoupon } = cartSlice.actions
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

### React 使用

```tsx
import { Provider, useDispatch, useSelector } from 'react-redux'

function CartButton() {
  const itemCount = useSelector((state: RootState) => state.cart.items.length)
  const dispatch = useDispatch<AppDispatch>()

  return (
    <button onClick={() => dispatch(addItem({ productId: 'p1', name: 'Keyboard', quantity: 1 }))}>
      购物车（{itemCount}）
    </button>
  )
}

root.render(
  <Provider store={store}>
    <App />
  </Provider>,
)
```

Redux Toolkit 内部使用 Immer，因此 Reducer 中看似直接修改 State，实际仍产生不可变结果。

## 11. 轻量全局客户端状态：Zustand

### 使用频率

★★★★☆。在不需要完整 Redux 体系的中小型和现代 React 项目中非常常见。

### 适用场景

- 全局播放器；
- 布局偏好；
- 多页面临时草稿；
- 购物车客户端状态；
- 编辑器状态；
- 希望避免 Redux 样板代码。

### 案例

```ts
import { create } from 'zustand'

interface PlayerStore {
  trackId: string | null
  playing: boolean
  volume: number
  play: (trackId: string) => void
  pause: () => void
  setVolume: (volume: number) => void
}

export const usePlayerStore = create<PlayerStore>((set) => ({
  trackId: null,
  playing: false,
  volume: 1,
  play: (trackId) => set({ trackId, playing: true }),
  pause: () => set({ playing: false }),
  setVolume: (volume) => set({ volume }),
}))
```

组件只订阅需要的字段：

```tsx
function PlayerControls() {
  const playing = usePlayerStore((state) => state.playing)
  const pause = usePlayerStore((state) => state.pause)

  return <button onClick={pause}>{playing ? '暂停' : '未播放'}</button>
}
```

### 与自定义 Hook 的区别

普通自定义 Hook 中的 `useState` 每调用一次会产生一份独立状态。Zustand Store 创建在组件外部，所有组件读取同一个 Store。

## 12. 原子状态：Jotai

### 使用频率

★★★☆☆。在适合细粒度状态图的项目中很受欢迎，但总体使用范围小于 Redux Toolkit 和 Zustand。

### 适用场景

- 状态天然可以拆成许多原子；
- 派生状态较多；
- 不希望维护单一大 Store；
- 需要细粒度订阅。

```ts
import { atom } from 'jotai'

export const firstNameAtom = atom('Ada')
export const lastNameAtom = atom('Lovelace')
export const fullNameAtom = atom((get) => `${get(firstNameAtom)} ${get(lastNameAtom)}`)
```

```tsx
import { useAtom, useAtomValue } from 'jotai'

function ProfileEditor() {
  const [firstName, setFirstName] = useAtom(firstNameAtom)
  const fullName = useAtomValue(fullNameAtom)

  return (
    <>
      <input value={firstName} onChange={(event) => setFirstName(event.target.value)} />
      <p>{fullName}</p>
    </>
  )
}
```

## 13. 响应式对象状态：MobX 和 Valtio

### 使用频率

- MobX：★★★☆☆，历史项目和复杂编辑应用中常见；
- Valtio：★★☆☆☆，适合偏好 Proxy 模型的小型或图形应用。

MobX 示例：

```ts
import { makeAutoObservable } from 'mobx'

class DocumentStore {
  title = ''
  blocks: string[] = []

  constructor() {
    makeAutoObservable(this)
  }

  addBlock(content: string) {
    this.blocks.push(content)
  }

  get blockCount() {
    return this.blocks.length
  }
}

export const documentStore = new DocumentStore()
```

```tsx
import { observer } from 'mobx-react-lite'

const DocumentEditor = observer(() => (
  <button onClick={() => documentStore.addBlock('新段落')}>
    段落数量：{documentStore.blockCount}
  </button>
))
```

这类方案允许直接修改对象，适合编辑器、画布和领域模型，但状态变化路径比 Redux 隐式，需要团队约束。

## 14. 服务端查询状态：TanStack Query

### 使用频率

★★★★★。在不依赖 Redux 的 REST/HTTP React 项目中，是生产上最常见的服务端状态方案之一。

### 服务端状态为什么特殊

服务端数据不仅包含值，还包含：

- 加载和错误；
- 缓存和过期；
- 后台刷新；
- 请求去重；
- 重试；
- 分页；
- 网络重连；
- 修改后的缓存失效；
- 乐观更新。

### 查询案例

```tsx
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient()

async function getProducts(category: string) {
  const response = await fetch(`/api/products?category=${encodeURIComponent(category)}`)
  if (!response.ok) throw new Error('商品加载失败')
  return response.json() as Promise<Product[]>
}

function ProductList({ category }: { category: string }) {
  const query = useQuery({
    queryKey: ['products', { category }],
    queryFn: () => getProducts(category),
    staleTime: 30_000,
  })

  if (query.isLoading) return <p>加载中</p>
  if (query.isError) return <p>{query.error.message}</p>

  return query.data.map((product) => <div key={product.id}>{product.name}</div>)
}

root.render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
)
```

### 修改案例

```tsx
function ProductEditor() {
  const queryClient = useQueryClient()
  const updateProductMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData(['product', updatedProduct.id], updatedProduct)
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
  })

  return (
    <button
      disabled={updateProductMutation.isPending}
      onClick={() => updateProductMutation.mutate({ id: 'p1', name: 'New name' })}
    >
      保存
    </button>
  )
}
```

不建议把相同接口数据同时复制到 TanStack Query 和 Redux/Zustand，否则容易出现两个缓存源。

## 15. Redux 项目的服务端状态：RTK Query

### 使用频率

★★★★☆。在已经使用 Redux Toolkit 的项目中属于主流选择。

### API 定义

```ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const productApi = createApi({
  reducerPath: 'productApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], { category?: string }>({
      query: (params) => ({ url: '/products', params }),
      providesTags: ['Product'],
    }),
    updateProduct: builder.mutation<Product, Partial<Product> & Pick<Product, 'id'>>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Product'],
    }),
  }),
})

export const { useGetProductsQuery, useUpdateProductMutation } = productApi
```

### 使用

```tsx
function ProductList() {
  const { data = [], isLoading } = useGetProductsQuery({ category: 'keyboard' })
  const [updateProduct, updateState] = useUpdateProductMutation()

  return (
    <>
      {data.map((product) => (
        <button
          key={product.id}
          disabled={updateState.isLoading}
          onClick={() => updateProduct({ id: product.id, name: 'Updated' })}
        >
          {product.name}
        </button>
      ))}
    </>
  )
}
```

TanStack Query 和 RTK Query 通常二选一，不需要同时管理同一种服务端数据。

## 16. SWR

### 使用频率

★★★☆☆。在 Next.js、Vercel 技术生态和偏好轻量 API 的项目中较常见。

```tsx
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error('请求失败')
  return response.json()
}

function UserProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/profile', fetcher)

  if (isLoading) return <p>加载中</p>
  if (error) return <p>加载失败</p>

  return <button onClick={() => mutate()}>{data.name}</button>
}
```

SWR API 简洁；需要复杂 Mutation、分页、离线和缓存控制时，TanStack Query 通常提供更完整的能力。

## 17. GraphQL 状态：Apollo Client

### 使用频率

★★★☆☆。在 GraphQL 项目中属于主流方案之一，在纯 REST 项目中通常不使用。

```tsx
import { gql, useMutation, useQuery } from '@apollo/client'

const GET_PRODUCTS = gql`
  query GetProducts {
    products {
      id
      name
      price
    }
  }
`

function ProductList() {
  const { data, loading, error } = useQuery(GET_PRODUCTS)

  if (loading) return <p>加载中</p>
  if (error) return <p>{error.message}</p>

  return data.products.map((product: Product) => <div key={product.id}>{product.name}</div>)
}
```

Apollo Client 提供基于对象 ID 的 Normalized Cache，可以在多个查询之间共享实体数据。

## 18. 表单状态：React Hook Form

### 使用频率

★★★★★。在没有使用完整组件库 Form 的项目中，是生产上最常见的表单方案之一。

### 适用场景

- 字段多；
- 校验复杂；
- 动态字段；
- 希望减少受控输入造成的渲染；
- 需要 Dirty、Touched、Error、Submitting 状态。

```tsx
import { useForm } from 'react-hook-form'

interface RegisterForm {
  username: string
  email: string
  password: string
}

function RegisterPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<RegisterForm>()

  const onSubmit = async (values: RegisterForm) => {
    await registerUser(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username', { required: '请输入用户名' })} />
      {errors.username && <p>{errors.username.message}</p>}

      <input
        {...register('email', {
          required: '请输入邮箱',
          pattern: { value: /^\S+@\S+$/, message: '邮箱格式不正确' },
        })}
      />

      <input type="password" {...register('password', { minLength: 8 })} />

      <button disabled={!isDirty || isSubmitting}>注册</button>
    </form>
  )
}
```

Ant Design Form、Formik 等也属于这一类别。已经使用成熟组件库时，通常优先使用组件库自带表单系统。

## 19. URL 状态

### 使用频率

★★★★★。分页、筛选和可分享页面中属于标准实践。

### 应放入 URL 的状态

- 页码和每页数量；
- 搜索关键词；
- 排序；
- 筛选条件；
- 当前 Tab；
- 当前打开的资源 ID；
- 能够复制分享的页面视图。

React Router 示例：

```tsx
import { useSearchParams } from 'react-router-dom'

function ProductSearch() {
  const [searchParams, setSearchParams] = useSearchParams()
  const keyword = searchParams.get('keyword') ?? ''
  const page = Number(searchParams.get('page') ?? 1)

  const updateKeyword = (value: string) => {
    setSearchParams({ keyword: value, page: '1' })
  }

  return (
    <>
      <input value={keyword} onChange={(event) => updateKeyword(event.target.value)} />
      <button onClick={() => setSearchParams({ keyword, page: String(page + 1) })}>下一页</button>
    </>
  )
}
```

URL 状态可以作为 Query Key：

```tsx
useQuery({
  queryKey: ['products', { keyword, page }],
  queryFn: () => getProducts({ keyword, page }),
})
```

## 20. 持久化状态：LocalStorage 和 SessionStorage

### 使用频率

★★★★☆。用户偏好和小型草稿中非常常见。

### 自定义 Hook

```tsx
function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    if (!stored) return initialValue

    try {
      return JSON.parse(stored) as T
    } catch {
      return initialValue
    }
  })

  const updateValue = (nextValue: T | ((current: T) => T)) => {
    setValue((current) => {
      const resolved = nextValue instanceof Function ? nextValue(current) : nextValue
      localStorage.setItem(key, JSON.stringify(resolved))
      return resolved
    })
  }

  return [value, updateValue] as const
}
```

使用：

```tsx
const [theme, setTheme] = useLocalStorageState<'light' | 'dark'>('theme', 'light')
```

不要在 LocalStorage 保存高敏感信息。它能被页面中的 JavaScript 读取，一旦发生 XSS，数据可能泄露。

## 21. 大量离线数据：IndexedDB

### 使用频率

★★☆☆☆。普通网站不一定需要，离线应用、编辑器和 PWA 中非常重要。

适合：

- 离线文章；
- 大型草稿；
- Blob、图片、文件；
- 缓存大量结构化数据；
- 断网后继续编辑。

通常使用 Dexie 简化 IndexedDB：

```ts
import Dexie, { type EntityTable } from 'dexie'

interface Draft {
  id: string
  title: string
  content: string
  updatedAt: number
}

const database = new Dexie('editor') as Dexie & {
  drafts: EntityTable<Draft, 'id'>
}

database.version(1).stores({
  drafts: 'id, updatedAt',
})

await database.drafts.put({
  id: 'draft-1',
  title: '离线草稿',
  content: '...',
  updatedAt: Date.now(),
})
```

IndexedDB 是存储层，不自动等于 React 状态管理。需要通过专用 Hook、订阅或查询库把变化连接到 UI。

## 22. 非渲染状态：useRef

### 使用频率

★★★★★。几乎所有中大型项目都会使用。

以下值通常不应该放入 State：

- DOM 节点；
- 定时器 ID；
- WebSocket 实例；
- AbortController；
- 上一次值；
- 不需要触发渲染的计数器；
- 第三方库实例。

```tsx
function SearchInput() {
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const search = async (keyword: string) => {
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    await fetch(`/api/search?q=${encodeURIComponent(keyword)}`, {
      signal: abortControllerRef.current.signal,
    })
  }

  return <input ref={inputRef} onChange={(event) => void search(event.target.value)} />
}
```

修改 `ref.current` 不会触发组件重新渲染。

## 23. 异步提交与 Mutation 状态

### 使用频率

★★★★★。所有存在保存、删除、上传的项目都需要。

简单场景：

```tsx
const [submitting, setSubmitting] = useState(false)

const submit = async () => {
  setSubmitting(true)
  try {
    await saveOrder()
  } finally {
    setSubmitting(false)
  }
}
```

服务端数据修改推荐使用 Mutation：

```tsx
const createOrderMutation = useMutation({
  mutationFn: createOrder,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] })
  },
})

<button
  disabled={createOrderMutation.isPending}
  onClick={() => createOrderMutation.mutate(orderPayload)}
>
  提交订单
</button>
```

React 19 的 `useActionState` 适合表单 Action：

```tsx
async function saveProfile(previousState: FormState, formData: FormData) {
  const name = String(formData.get('name') ?? '')
  if (!name) return { error: '请输入姓名' }
  await updateProfile({ name })
  return { success: true }
}

function ProfileForm() {
  const [state, action, pending] = useActionState(saveProfile, {})

  return (
    <form action={action}>
      <input name="name" />
      {state.error && <p>{state.error}</p>}
      <button disabled={pending}>保存</button>
    </form>
  )
}
```

React Actions 是异步提交工具，不是 Redux 或 Zustand 的替代品。

## 24. 乐观状态

### 使用频率

★★★☆☆。社交、消息、协作和高交互应用中常见。

乐观更新是在服务器确认前先更新 UI：

```tsx
const mutation = useMutation({
  mutationFn: toggleFavorite,
  onMutate: async (productId) => {
    await queryClient.cancelQueries({ queryKey: ['favorites'] })
    const previous = queryClient.getQueryData<string[]>(['favorites']) ?? []

    queryClient.setQueryData<string[]>(['favorites'], (current = []) =>
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId],
    )

    return { previous }
  },
  onError: (_error, _productId, context) => {
    queryClient.setQueryData(['favorites'], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['favorites'] })
  },
})
```

乐观更新必须设计失败回滚，否则 UI 可能与服务器不一致。

## 25. 实时状态：WebSocket 和 SSE

### 使用频率

★★★☆☆。聊天、通知、行情和协作系统中常见。

常见做法是：

- 历史数据由 TanStack Query 或 RTK Query 管理；
- 连接状态由 Context、Zustand 或专用 Hook 管理；
- 新消息到达后更新 Query Cache。

```tsx
function useOrderEvents() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const socket = new WebSocket('wss://example.com/orders')

    socket.addEventListener('message', (event) => {
      const updatedOrder = JSON.parse(event.data) as Order

      queryClient.setQueryData<Order[]>(['orders'], (orders = []) =>
        orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
      )
      queryClient.setQueryData(['order', updatedOrder.id], updatedOrder)
    })

    return () => socket.close()
  }, [queryClient])
}
```

不要为 WebSocket 推送数据再维护一份与 Query Cache 重复的完整列表。

## 26. 复杂业务流程：状态机和 XState

### 使用频率

★★☆☆☆。不是普通项目必需，但支付、审批、上传和设备控制等严格流程非常适合。

```text
idle → validating → submitting → success
                       ↓
                     failed → retrying
```

XState 示例：

```ts
import { createMachine } from 'xstate'

const paymentMachine = createMachine({
  id: 'payment',
  initial: 'idle',
  states: {
    idle: {
      on: { PAY: 'processing' },
    },
    processing: {
      on: {
        SUCCEED: 'success',
        FAIL: 'failed',
      },
    },
    success: {
      type: 'final',
    },
    failed: {
      on: { RETRY: 'processing', CANCEL: 'idle' },
    },
  },
})
```

状态机可以避免以下非法组合：

```text
loading = true
success = true
error 不为空
```

## 27. 动画、拖拽和高频瞬时状态

### 使用频率

★★★☆☆。交互型项目常见。

鼠标坐标、滚动位置和动画帧可能每秒更新几十次。把所有高频值放入 React State 会导致大量渲染。

可以使用：

- `useRef` 保存不需要渲染的最新值；
- CSS 动画；
- requestAnimationFrame；
- Framer Motion 的 MotionValue；
- 专用拖拽库；
- Canvas/WebGL 引擎自己的状态系统。

```tsx
function PointerTracker() {
  const positionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      positionRef.current = { x: event.clientX, y: event.clientY }
    }

    window.addEventListener('pointermove', handlePointerMove)
    return () => window.removeEventListener('pointermove', handlePointerMove)
  }, [])

  return null
}
```

只有确实需要显示的节流结果才进入 React State。

## 28. 跨浏览器标签页状态

### 使用频率

★★☆☆☆。多标签后台、登录同步和协作工具中常见。

BroadcastChannel 示例：

```tsx
function useCrossTabLogout(logout: () => void) {
  useEffect(() => {
    const channel = new BroadcastChannel('auth')

    channel.addEventListener('message', (event) => {
      if (event.data?.type === 'logout') logout()
    })

    return () => channel.close()
  }, [logout])
}

function logoutEverywhere() {
  const channel = new BroadcastChannel('auth')
  channel.postMessage({ type: 'logout' })
  channel.close()
}
```

也可以监听 LocalStorage 的 `storage` 事件。BroadcastChannel 不应替代服务器会话失效机制。

## 29. 离线优先和同步状态

### 使用频率

★★☆☆☆。PWA、移动 Web、现场作业和协作编辑中使用。

离线优先项目通常需要同时维护：

- 本地实体数据；
- 待同步操作队列；
- 网络状态；
- 冲突状态；
- 最后同步时间；
- 服务端版本号。

```ts
interface PendingOperation {
  id: string
  entityId: string
  type: 'create' | 'update' | 'delete'
  payload: unknown
  createdAt: number
  retryCount: number
}
```

这类状态通常使用 IndexedDB 保存，配合 Service Worker、Query 库和冲突解决策略。不能只依靠一个普通的 Redux 数组，因为刷新和断电后操作队列不能丢失。

## 30. Server Components 与服务端状态

### 使用频率

★★★☆☆，在支持 React Server Components 的框架项目中越来越常见。

服务端组件可以直接加载只读首屏数据：

```tsx
export default async function ProductPage() {
  const products = await database.product.findMany()
  return <ProductList products={products} />
}
```

这类数据不一定需要先进入客户端 Store。客户端只管理交互状态：

```tsx
'use client'

function AddToCartButton({ productId }: { productId: string }) {
  const [pending, setPending] = useState(false)
  // 客户端交互
}
```

Server Components 不是传统客户端状态库，而是把部分数据获取和渲染移回服务端。

## 31. 外部 Store 与 useSyncExternalStore

### 使用频率

应用代码直接使用：★☆☆☆☆；状态库内部使用：★★★★★。

React 18 提供 `useSyncExternalStore`，用于并发安全地订阅组件外部 Store：

```tsx
let count = 0
const listeners = new Set<() => void>()

const counterStore = {
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot() {
    return count
  },
  increment() {
    count += 1
    listeners.forEach((listener) => listener())
  },
}

function Counter() {
  const count = useSyncExternalStore(
    counterStore.subscribe,
    counterStore.getSnapshot,
    counterStore.getSnapshot,
  )

  return <button onClick={counterStore.increment}>{count}</button>
}
```

业务项目通常直接使用 Redux、Zustand 等已经正确集成该机制的库。

## 32. 生产环境使用最多的方案

### 第一梯队：几乎所有项目都会用

1. **`useState`**：局部 UI 状态使用最频繁。
2. **直接计算和 `useMemo`**：管理派生值。
3. **`useRef`**：DOM、实例和非渲染状态。
4. **URL Search Params**：分页、筛选、排序和可分享状态。
5. **表单库或组件库 Form**：复杂表单状态。
6. **服务端状态库**：TanStack Query 或 RTK Query。

### 第二梯队：跨组件状态主流方案

1. **Context**：主题、语言、登录用户等低频状态。
2. **Redux Toolkit**：大型团队和复杂全局客户端状态。
3. **Zustand**：轻量全局客户端状态。

Redux Toolkit 和 Zustand 不是必须同时使用。通常根据复杂度和团队习惯选择一个。

### 第三梯队：按业务选择

- Jotai：原子化和派生状态；
- MobX：响应式领域模型和编辑器；
- Apollo Client：GraphQL；
- SWR：轻量服务端缓存；
- XState：严格业务流程；
- IndexedDB/Dexie：离线和大量本地数据；
- BroadcastChannel：跨标签同步。

## 33. 最常见的生产组合

### 组合 A：普通中后台或 SaaS

```text
useState / useReducer        局部 UI
React Hook Form / UI Form    表单
TanStack Query               服务端数据
Context                      登录、主题、语言
Router Search Params         分页和筛选
```

这是目前最常见、依赖较少的组合之一。没有复杂全局客户端状态时，不必增加 Redux 或 Zustand。

### 组合 B：大型 Redux 项目

```text
useState                     局部 UI
Redux Toolkit                全局客户端状态
RTK Query                    服务端数据
React Hook Form              表单
Router Search Params         URL 状态
```

优点是规范统一、DevTools 完整，适合多人协作和已有 Redux 技术积累的团队。

### 组合 C：轻量现代应用

```text
useState                     局部 UI
Zustand                      少量全局客户端状态
TanStack Query               服务端数据
React Hook Form              表单
Router                       URL 状态
```

适合希望减少样板代码、又需要少量全局共享状态的项目。

### 组合 D：GraphQL 应用

```text
useState                     局部 UI
Apollo Client                GraphQL 服务端数据
Context / Zustand            非 GraphQL 客户端状态
React Hook Form              表单
Router                       URL 状态
```

### 组合 E：复杂编辑器或协作工具

```text
useState / useRef            局部和高频瞬时状态
Zustand / MobX               编辑器领域状态
TanStack Query               普通服务端数据
WebSocket                    实时增量
IndexedDB                    离线草稿
XState                       严格工作流
```

## 34. 不推荐的做法

### 34.1 所有状态都放 Redux

```ts
interface RootState {
  modalOpen: boolean
  inputValue: string
  users: User[]
  currentPage: number
  timerId: number
}
```

这些值分别可能属于局部 State、服务端缓存、URL 和 Ref。全部放进 Redux 会增加耦合。

### 34.2 把服务端数据复制到多个 Store

```tsx
const { data } = useQuery(...)

useEffect(() => {
  zustandStore.setUsers(data)
}, [data])
```

除非存在明确的数据快照需求，否则会形成两个数据源。

### 34.3 使用 useEffect 同步派生状态

```tsx
useEffect(() => {
  setTotal(items.reduce(calculateTotal, 0))
}, [items])
```

应直接计算或使用 `useMemo`。

### 34.4 把可分享状态只放 useState

分页、搜索和筛选只放在 `useState`，刷新后会丢失，也无法复制链接。

### 34.5 把敏感信息当普通持久化状态

不要因为使用方便就把长期令牌、密钥和敏感数据放入 LocalStorage。

### 34.6 使用布尔值表示复杂流程

```tsx
const [loading, setLoading] = useState(false)
const [success, setSuccess] = useState(false)
const [failed, setFailed] = useState(false)
```

应使用互斥状态：

```ts
type Status = 'idle' | 'loading' | 'success' | 'failed'
```

## 35. 选型检查清单

在添加一个 State 或状态库前，逐项确认：

- 这个值是否能直接计算？
- 谁拥有这个状态？
- 有多少组件需要读取？
- 更新频率有多高？
- 是否来自服务器？
- 是否应该进入 URL？
- 是否需要刷新后保留？
- 是否涉及敏感数据？
- 是否存在严格状态转换？
- 是否需要乐观更新？
- 是否需要离线支持？
- 是否需要跨标签页同步？
- 是否需要 DevTools 和事件审计？
- 数据是否已经被其他缓存管理？

## 36. 最终建议

对于大多数 React 项目，可以从下面的最小组合开始：

```text
useState          局部 UI
useMemo           派生数据
useRef            非渲染实例
Context           用户、主题、语言
TanStack Query    服务端数据
表单库            表单值和校验
Router            URL 状态
```

只有出现明确的复杂客户端共享状态时，再加入：

```text
Zustand            轻量全局状态
或 Redux Toolkit   大型、强规范全局状态
```

只有存在特定业务需求时，再加入：

```text
XState             严格流程
IndexedDB          离线和大量本地数据
BroadcastChannel   跨标签同步
Apollo Client      GraphQL
```

生产中使用最频繁的不是某一个全局状态库，而是按职责组合：局部状态使用 React 原生 Hook，服务端状态使用 Query 库，表单交给表单库，分页筛选进入 URL，真正的全局客户端状态才交给 Redux Toolkit 或 Zustand。这种按状态性质分层的方案，比把所有数据统一塞进一个 Store 更容易维护、测试和扩展。

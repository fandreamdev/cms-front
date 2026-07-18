# React 明暗主题圆形过渡实现指南

## 1. 效果目标

本文记录一种生产可用的 React 明暗主题切换方案：

- 切换按钮位于页面右上角；
- 黑夜切换白天时，白天主题从按钮中心形成圆形并向外扩散；
- 白天切换黑夜时，旧白天主题从整个屏幕向按钮中心收缩，露出黑夜主题；
- 动画覆盖整个浏览器视口；
- 主题选择刷新后保持；
- 首次访问可以跟随系统主题；
- 不支持 View Transitions API 时正常切换，不阻塞功能；
- 用户开启“减少动态效果”时不播放大范围动画；
- Ant Design 组件和自定义 CSS 同时适配主题；
- 快速重复点击不会产生并发主题动画。

最终实现使用：

- React Context 管理主题状态；
- Ant Design `ConfigProvider` 和主题算法切换组件 Token；
- CSS 变量管理自定义颜色；
- View Transitions API 捕获新旧页面快照；
- CSS Keyframes 驱动 View Transition 伪元素的圆形裁剪；
- LocalStorage 持久化用户选择；
- `prefers-color-scheme` 和 `prefers-reduced-motion` 处理系统偏好。

## 2. 为什么普通 CSS Transition 不够

普通主题切换通常只是修改 Class：

```ts
document.documentElement.dataset.theme = 'dark'
```

然后给颜色添加过渡：

```css
body {
  transition:
    color 300ms,
    background-color 300ms;
}
```

这种方式只能让每个元素分别渐变，无法实现“新主题从按钮位置形成一个圆并覆盖旧主题”的效果。

圆形覆盖需要同时保留：

1. 切换前的完整页面快照；
2. 切换后的完整页面快照；
3. 对其中一个快照使用 `clip-path: circle(...)`；
4. 在两个快照之间控制层级关系。

View Transitions API 正好提供：

```css
::view-transition-old(root)
::view-transition-new(root)
```

它们分别代表主题更新前和更新后的页面快照。

## 3. 动画模型

### 3.1 黑夜切换白天

目标是白天主题从按钮位置扩散：

```text
旧黑夜图层：在下方，保持完整
新白天图层：在上方，从 circle(0) 扩大到覆盖屏幕
```

对应伪元素：

```css
::view-transition-new(root);
```

动画：

```text
circle(0 at buttonCenter)
  → circle(maxRadius at buttonCenter)
```

### 3.2 白天切换黑夜

如果仍让新黑夜主题扩散，视觉方向与需求并不完全相反。为了实现真正的反向效果，应让旧白天图层收缩：

```text
新黑夜图层：在下方，已经完整存在
旧白天图层：在上方，从完整圆形收缩回按钮位置
```

对应伪元素：

```css
::view-transition-old(root);
```

动画：

```text
circle(maxRadius at buttonCenter)
  → circle(0 at buttonCenter)
```

## 4. 文件结构

推荐结构：

```text
src/
  contexts/
    ThemeContext.tsx
    themeContextValue.ts
  components/
    AppHeader/
      AppHeader.tsx
  types/
    view-transition.d.ts
  index.css
  main.tsx
```

职责：

| 文件                   | 职责                                 |
| ---------------------- | ------------------------------------ |
| `themeContextValue.ts` | 主题类型、Context 和消费 Hook        |
| `ThemeContext.tsx`     | 状态、持久化、Ant Design、动画协调   |
| `AppHeader.tsx`        | 切换按钮和按钮中心坐标               |
| `view-transition.d.ts` | 浏览器 API 类型补充                  |
| `index.css`            | 自定义主题变量、伪元素层级和圆形动画 |
| `main.tsx`             | 在应用根节点挂载 ThemeProvider       |

## 5. 主题 Context

定义主题模式和切换坐标：

```tsx
import { createContext, use } from 'react'

export type ThemeMode = 'light' | 'dark'

export interface ThemeTransitionOrigin {
  x: number
  y: number
}

export interface ThemeContextValue {
  mode: ThemeMode
  isDark: boolean
  transitioning: boolean
  toggleTheme: (origin?: ThemeTransitionOrigin) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export const useThemeMode = () => {
  const context = use(ThemeContext)
  if (!context) throw new Error('useThemeMode must be used within ThemeProvider')
  return context
}
```

`transitioning` 用于动画期间禁用切换按钮。只使用 React State 还不够，因为连续点击可能发生在 React 完成下一次渲染之前，因此实现中还会使用同步 Ref 锁。

## 6. 初始主题和持久化

### 6.1 读取顺序

推荐优先级：

1. 用户之前主动选择的主题；
2. 操作系统主题；
3. 默认白天主题。

```ts
const THEME_STORAGE_KEY = 'cms:theme'

const getInitialTheme = (): ThemeMode => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme
  } catch {
    // 浏览器禁止本地存储时继续使用系统主题
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}
```

### 6.2 保存主题

LocalStorage 在隐私模式、安全策略或存储空间异常时可能抛错，不能让存储失败阻止主题切换：

```ts
const saveTheme = (mode: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode)
  } catch {
    // 当前会话仍然允许切换
  }
}
```

### 6.3 应用到根元素

```ts
const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
}
```

生成结果：

```html
<html data-theme="dark" style="color-scheme: dark"></html>
```

`color-scheme` 可以让浏览器原生表单控件、滚动条等尽可能匹配当前主题。

## 7. Ant Design 主题切换

Ant Design 应使用官方算法，而不是用 CSS 强制覆盖所有组件：

```tsx
import { ConfigProvider, theme as antdTheme } from 'antd'

;<ConfigProvider
  theme={{
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#1677ff',
      borderRadius: 8,
    },
  }}
>
  {children}
</ConfigProvider>
```

这会自动处理：

- Card；
- Table；
- Modal；
- Dropdown；
- Input；
- Form；
- Button；
- Tabs；
- Typography；
- 大部分组件状态色。

不要维护两套完整的 Ant Design 覆盖样式，否则组件升级后容易出现遗漏。

## 8. 获取按钮中心坐标

圆形动画应从用户实际点击的按钮中心开始，而不是写死浏览器右上角：

```tsx
<Button
  shape="circle"
  icon={isDark ? <SunOutlined /> : <MoonOutlined />}
  onClick={(event) => {
    const bounds = event.currentTarget.getBoundingClientRect()

    toggleTheme({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    })
  }}
/>
```

必须使用 `event.currentTarget`，因为 `event.target` 可能是按钮内部的 SVG 图标，得到的尺寸和坐标不稳定。

## 9. 计算覆盖整个屏幕的半径

圆心位于右上角附近时，最远点通常是左下角，但按钮位置可能变化，因此应计算圆心到四边最远距离：

```ts
const getMaximumRadius = ({ x, y }: ThemeTransitionOrigin) =>
  Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
```

计算过程：

```text
水平最大距离 = max(x, viewportWidth - x)
垂直最大距离 = max(y, viewportHeight - y)
半径 = hypot(水平最大距离, 垂直最大距离)
```

使用固定 `100vw` 或 `100vh` 可能无法覆盖对角线。`150vmax` 可以作为 CSS 回退值，但运行时精确半径更可靠。

## 10. View Transition 更新主题

### 10.1 浏览器能力检测

```ts
const startViewTransition = document.startViewTransition?.bind(document)
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

如果 API 不存在或用户要求减少动画，立即切换：

```ts
if (!startViewTransition || reduceMotion) {
  applyTheme(nextMode)
  setMode(nextMode)
  return
}
```

功能不能依赖动画 API。View Transition 只负责增强体验。

### 10.2 把动画参数交给 CSS

```ts
const radius = getMaximumRadius(center)

document.documentElement.style.setProperty('--theme-transition-x', `${center.x}px`)
document.documentElement.style.setProperty('--theme-transition-y', `${center.y}px`)
document.documentElement.style.setProperty('--theme-transition-radius', `${radius}px`)
```

使用 CSS 变量的原因是：

- 每次按钮位置不同；
- 视口尺寸不同；
- CSS Keyframes 必须在伪元素出现的第一帧拿到圆心和半径；
- 不需要动态插入 Style 标签或动态生成 Keyframes。

### 10.3 同步提交 React 主题更新

```ts
const transition = startViewTransition(() => {
  flushSync(() => setMode(nextMode))
  applyTheme(nextMode)
})
```

`flushSync` 的作用是确保 View Transition 的更新回调结束前，React 已经完成新主题渲染。否则浏览器可能截取到主题状态与组件样式不一致的中间画面。

不要在普通业务代码中大量使用 `flushSync`。这里使用是为了配合浏览器截取新旧快照的明确时序。

### 10.4 清理动画变量

```ts
void transition.finished
  .catch(() => applyTheme(nextMode))
  .finally(() => {
    transitioningRef.current = false
    setTransitioning(false)
    document.documentElement.style.removeProperty('--theme-transition-x')
    document.documentElement.style.removeProperty('--theme-transition-y')
    document.documentElement.style.removeProperty('--theme-transition-radius')
  })
```

必须等 `transition.finished` 后再删除 CSS 变量。如果过早删除，伪元素动画会突然使用回退圆心或回退半径，造成跳动或闪烁。

## 11. CSS 主题变量

Ant Design 算法只能处理 Ant Design 组件，自定义内容仍需要主题变量：

```css
:root {
  --app-bg: #f5f5f5;
  --surface-bg: #fff;
  --subtle-bg: #fafafa;
  --code-bg: #f5f5f5;
  --text-secondary: #666;
  --border-color: #d9d9d9;
}

:root[data-theme='dark'] {
  --app-bg: #000;
  --surface-bg: #141414;
  --subtle-bg: #1f1f1f;
  --code-bg: #262626;
  --text-secondary: #bfbfbf;
  --border-color: #424242;
}
```

使用：

```css
html,
body,
#root {
  min-height: 100%;
  background: var(--app-bg);
}

.custom-card {
  color: inherit;
  background: var(--surface-bg);
  border: 1px solid var(--border-color);
}
```

不要继续写死：

```css
background: #fff;
color: #333;
border-color: #eee;
```

否则 Ant Design 组件已经变暗，自定义区域仍会保持白色。

## 12. 禁用浏览器默认快照动画

View Transition 默认可能带有淡入淡出动画，会与圆形裁剪叠加：

```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
```

`mix-blend-mode: normal` 可以避免新旧快照因为混合模式产生异常颜色。

## 13. 圆形 Keyframes

### 13.1 白天主题扩散

```css
@keyframes theme-circle-reveal {
  from {
    clip-path: circle(
      0 at var(--theme-transition-x, calc(100vw - 44px)) var(--theme-transition-y, 32px)
    );
  }

  to {
    clip-path: circle(
      var(--theme-transition-radius, 150vmax) at var(--theme-transition-x, calc(100vw - 44px))
        var(--theme-transition-y, 32px)
    );
  }
}
```

### 13.2 白天主题收缩

```css
@keyframes theme-circle-hide {
  from {
    clip-path: circle(
      var(--theme-transition-radius, 150vmax) at var(--theme-transition-x, calc(100vw - 44px))
        var(--theme-transition-y, 32px)
    );
  }

  to {
    clip-path: circle(
      0 at var(--theme-transition-x, calc(100vw - 44px)) var(--theme-transition-y, 32px)
    );
  }
}
```

## 14. 新旧图层层级

白天扩散时，新白天图层必须在旧黑夜图层上方：

```css
:root[data-theme='light']::view-transition-old(root) {
  z-index: 0;
}

:root[data-theme='light']::view-transition-new(root) {
  z-index: 1;
}
```

黑夜切换时，旧白天图层必须在新黑夜图层上方，才能看到它逐渐收缩：

```css
:root[data-theme='dark']::view-transition-new(root) {
  z-index: 0;
}

:root[data-theme='dark']::view-transition-old(root) {
  z-index: 1;
}
```

合并写法：

```css
:root[data-theme='light']::view-transition-old(root),
:root[data-theme='dark']::view-transition-new(root) {
  z-index: 0;
}

:root[data-theme='light']::view-transition-new(root),
:root[data-theme='dark']::view-transition-old(root) {
  z-index: 1;
}
```

## 15. 将动画绑定到伪元素

```css
:root[data-theme='light']::view-transition-new(root) {
  animation: theme-circle-reveal 680ms cubic-bezier(0.76, 0, 0.24, 1) both;
}

:root[data-theme='dark']::view-transition-old(root) {
  animation: theme-circle-hide 680ms cubic-bezier(0.76, 0, 0.24, 1) both;
}
```

这里的 `both` 非常重要，它等价于：

```css
animation-fill-mode: both;
```

它同时包含：

- `backwards`：动画正式播放前应用第一帧状态；
- `forwards`：动画结束后保留最后一帧状态，直到伪元素被销毁。

缺少其中任意一个方向，都可能造成主题闪烁。

## 16. 完整 ThemeProvider 核心流程

```tsx
const toggleTheme = useCallback(
  (origin?: ThemeTransitionOrigin) => {
    if (transitioningRef.current) return

    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark'
    const center = origin ?? { x: window.innerWidth - 44, y: 32 }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const startViewTransition = document.startViewTransition?.bind(document)

    saveTheme(nextMode)

    if (!startViewTransition || reduceMotion) {
      applyTheme(nextMode)
      setMode(nextMode)
      return
    }

    const radius = getMaximumRadius(center)
    document.documentElement.style.setProperty('--theme-transition-x', `${center.x}px`)
    document.documentElement.style.setProperty('--theme-transition-y', `${center.y}px`)
    document.documentElement.style.setProperty('--theme-transition-radius', `${radius}px`)

    transitioningRef.current = true
    setTransitioning(true)

    const transition = startViewTransition(() => {
      flushSync(() => setMode(nextMode))
      applyTheme(nextMode)
    })

    void transition.finished
      .catch(() => applyTheme(nextMode))
      .finally(() => {
        transitioningRef.current = false
        setTransitioning(false)
        document.documentElement.style.removeProperty('--theme-transition-x')
        document.documentElement.style.removeProperty('--theme-transition-y')
        document.documentElement.style.removeProperty('--theme-transition-radius')
      })
  },
  [mode],
)
```

## 17. 常见问题一：切换黑夜后闪回白天

### 现象

白天主题向按钮中心收缩已经完成，黑夜主题也已经覆盖屏幕，但随后突然出现一次完整白天画面，然后又恢复黑夜。

### 根因

早期实现使用 Web Animations API：

```ts
document.documentElement.animate(
  {
    clipPath: [fullCircle, zeroCircle],
  },
  {
    pseudoElement: '::view-transition-old(root)',
  },
)
```

动画默认 `fill` 是 `none`。收缩动画结束后，`clip-path` 会立即恢复成未裁剪状态，但 View Transition 的旧白天伪元素还没有被浏览器销毁。

时间线：

```text
旧白天圆形收缩完成
  → 动画样式被移除
  → 旧白天图层恢复完整
  → 闪现白天
  → View Transition 销毁旧图层
  → 恢复黑夜
```

### 第一阶段修复

给 Web Animation 增加：

```ts
fill: 'forwards'
```

这样最后一帧会保持到伪元素销毁。

### 最终方案

改用 CSS Keyframes，并使用：

```css
animation-fill-mode: both;
```

同时锁定首帧和末帧，比只修复结束状态更完整。

## 18. 常见问题二：切换白天时先全白，再开始圆形动画

### 现象

点击按钮后：

1. 整个页面立即变成白天主题；
2. 又恢复黑夜主题；
3. 然后圆形白天主题才从按钮处开始扩散。

### 根因

早期实现等待：

```ts
await transition.ready
```

然后才通过 JavaScript 挂载圆形 Web Animation。

浏览器在 View Transition 新白天伪元素创建后、JavaScript 动画添加前，可能先绘制一帧完整的新图层。

时间线：

```text
创建完整新白天快照
  → 浏览器绘制完整白天图层
  → transition.ready 完成
  → JavaScript 设置 circle(0)
  → 页面看起来恢复黑夜
  → 圆形扩散动画开始
```

仅在普通 CSS 规则中预设 `clip-path: circle(0)` 仍可能受到伪元素创建、样式计算和 JavaScript 动画挂载时序影响。

### 解决方法

完全移除 `transition.ready` 后挂载的 JavaScript动画，改为伪元素自身的 CSS Keyframes：

```css
:root[data-theme='light']::view-transition-new(root) {
  animation: theme-circle-reveal 680ms cubic-bezier(0.76, 0, 0.24, 1) both;
}
```

`both` 中的 `backwards` 确保新白天伪元素出现的第一帧已经是 `circle(0)`，不存在完整白色中间帧。

## 19. 常见问题三：动画结束后出现一帧反色

通常是以下原因之一：

- 没有使用 `forwards` 或 `both`；
- CSS 变量在 `transition.finished` 前被删除；
- 新旧伪元素 z-index 写反；
- 浏览器默认淡入淡出动画没有禁用；
- React 主题状态和 `<html data-theme>` 更新不同步。

排查顺序：

1. 检查 Keyframes 是否使用 `both`；
2. 检查变量清理时机；
3. 检查 Light/Dark 对应的 Old/New 层级；
4. 检查是否存在其他 `::view-transition-*` 样式；
5. 检查主题更新是否位于同一个 `startViewTransition` 回调中。

## 20. 常见问题四：圆形无法覆盖角落

原因通常是半径只使用：

```ts
Math.max(window.innerWidth, window.innerHeight)
```

当圆心靠近右上角时，这个值可能小于圆心到左下角的距离。

应使用勾股定理：

```ts
Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
```

## 21. 常见问题五：动画起点不在按钮中心

错误写法：

```ts
const bounds = (event.target as HTMLElement).getBoundingClientRect()
```

`event.target` 可能是 SVG、Path 或 Span。

正确写法：

```ts
const bounds = event.currentTarget.getBoundingClientRect()
```

## 22. 常见问题六：连续点击导致主题错乱

只依赖 State：

```ts
if (transitioning) return
setTransitioning(true)
```

React State 更新不是立即同步的，极快的第二次点击可能仍读取旧值。

使用 Ref 作为同步锁：

```ts
if (transitioningRef.current) return
transitioningRef.current = true
setTransitioning(true)
```

过渡完成时同时恢复：

```ts
transitioningRef.current = false
setTransitioning(false)
```

按钮也应设置：

```tsx
disabled = { transitioning }
```

## 23. 常见问题七：部分页面仍然是白色

原因是自定义样式写死浅色：

```css
background: #fff;
border-color: #eee;
color: #333;
```

解决方案：

1. Ant Design 组件使用 `theme.useToken()`；
2. 自定义 CSS 使用主题变量。

React 组件：

```tsx
const {
  token: { colorBgContainer, colorFillAlter, boxShadowSecondary },
} = theme.useToken()
```

使用：

```tsx
<div style={{ background: colorFillAlter }} />
```

CSS：

```css
.custom-action {
  background: var(--surface-bg);
  border-color: var(--border-color);
}
```

## 24. 常见问题八：第一次加载主题闪烁

React 挂载后才读取 LocalStorage 时，浏览器可能先绘制默认白天主题，再切换黑夜。

SPA 中可以使用 `useLayoutEffect` 尽量在浏览器绘制前设置：

```tsx
useLayoutEffect(() => {
  applyTheme(mode)
}, [mode])
```

对首屏闪烁要求极高或使用 SSR 时，可以在 HTML `<head>` 中加入极短的同步脚本，在 CSS 加载前设置 `data-theme`：

```html
<script>
  try {
    const stored = localStorage.getItem('cms:theme')
    const mode =
      stored === 'light' || stored === 'dark'
        ? stored
        : matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
    document.documentElement.dataset.theme = mode
    document.documentElement.style.colorScheme = mode
  } catch {}
</script>
```

该脚本必须保持很小，避免阻塞首屏过久。

## 25. 常见问题九：View Transition 不执行

检查：

```ts
console.log(document.startViewTransition)
```

可能原因：

- 浏览器不支持；
- 当前浏览器版本未开启该能力；
- 用户启用了减少动画，本实现主动回退；
- 页面处于不允许捕获快照的特殊状态；
- 更新回调抛出异常；
- CSS 中没有为对应伪元素设置动画。

正确策略不是强制所有浏览器播放，而是渐进增强：

```ts
if (!document.startViewTransition) {
  setMode(nextMode)
}
```

## 26. TypeScript 类型补充

如果项目的 TypeScript DOM 类型还没有 View Transitions API，可以添加：

```ts
interface ViewTransition {
  readonly finished: Promise<void>
  readonly ready: Promise<void>
  readonly updateCallbackDone: Promise<void>
  skipTransition(): void
}

interface Document {
  startViewTransition?: (updateCallback: () => void | Promise<void>) => ViewTransition
}
```

应先检查当前 TypeScript 版本是否已经内置类型。如果存在，Interface Declaration 会合并，但字段类型必须保持兼容。

## 27. 可访问性

### 27.1 按钮标签

只有图标的按钮必须提供名称：

```tsx
<Button
  aria-label={isDark ? '切换到白天模式' : '切换到黑夜模式'}
  icon={isDark ? <SunOutlined /> : <MoonOutlined />}
/>
```

Tooltip 不能替代 `aria-label`。

### 27.2 减少动态效果

大面积扩散动画可能让部分用户不适：

```ts
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
```

开启时应直接切换主题。

### 27.3 颜色对比度

主题切换后需要检查：

- 正文；
- 次要文字；
- 链接；
- 禁用状态；
- 图表坐标；
- 表格边框；
- 表单占位符；
- 状态标签。

不能只检查背景是否变黑。

## 28. 性能注意事项

View Transition 会对页面进行快照。页面越复杂、图片越大，GPU 和内存开销越高。

建议：

- 动画控制在 400–800ms；
- 不要在主题切换同时执行大规模 DOM 更新；
- 避免切换期间触发路由跳转；
- 禁止重复点击；
- 大型 Canvas、Video、iframe 需要单独验证；
- 低性能设备可以缩短或禁用动画；
- 避免为大量子元素分别设置 `view-transition-name`，根快照通常已经足够。

## 29. SSR 注意事项

本文核心代码默认运行在浏览器。SSR 环境中访问以下对象前必须判断：

```ts
window
document
localStorage
matchMedia
```

例如：

```ts
if (typeof window === 'undefined') return 'light'
```

服务端应尽量通过 Cookie 获取主题并输出正确的 `data-theme`，否则可能发生 Hydration 前主题闪烁。

## 30. 图表和第三方组件

主题切换不仅影响基础组件，还要处理：

- Recharts 网格线、坐标轴和 Tooltip；
- 富文本编辑器；
- Markdown 代码块；
- 第三方弹窗；
- Portal 内容；
- 地图和 Canvas；
- Monaco Editor；
- Toast UI Editor。

对于支持主题属性的第三方组件，应传入当前模式：

```tsx
const { isDark } = useThemeMode()

<Chart gridColor={isDark ? '#303030' : '#eef2f7'} />
```

对于 Canvas 图表，CSS 变量不会自动重新绘制，需要在主题变化后更新配置。

## 31. 测试清单

### 功能

- 白天和黑夜可以双向切换；
- 图标和 Tooltip 与下一主题一致；
- 刷新后保持用户选择；
- 无存储权限时仍能切换；
- 首次访问跟随系统主题；
- 动画期间不能重复触发。

### 动画

- 黑夜切白天从按钮中心圆形扩散；
- 白天切黑夜向按钮中心圆形收缩；
- 圆形覆盖屏幕四角；
- 开始前没有整屏白色或黑色闪帧；
- 结束后没有反色闪帧；
- 动画过程中没有浏览器默认淡入淡出；
- 调整窗口大小后半径仍正确；
- 页面滚动时圆心仍与固定 Header 按钮一致。

### 兼容性

- 支持 View Transition 的 Chromium 浏览器播放动画；
- 不支持的浏览器直接切换；
- `prefers-reduced-motion: reduce` 下直接切换；
- 高 DPI 和缩放比例下圆心正确；
- 移动端横竖屏切换后正常。

### 视觉

- Layout、Card、Table、Modal、Dropdown 正确变色；
- 自定义卡片没有白色残留；
- 富文本和代码块正确变色；
- 图表坐标和网格线清晰；
- 登录页和错误页主题一致；
- Focus、Hover、Disabled 状态对比度足够。

## 32. 调试方法

### 32.1 放慢动画

临时改为：

```css
animation-duration: 3000ms;
```

可以观察：

- 哪个图层位于上方；
- 圆形方向是否正确；
- 起点是否正确；
- 结束状态是否保持。

### 32.2 检查根主题

```js
document.documentElement.dataset.theme
document.documentElement.style.colorScheme
```

### 32.3 检查 CSS 变量

```js
getComputedStyle(document.documentElement).getPropertyValue('--theme-transition-x')
getComputedStyle(document.documentElement).getPropertyValue('--theme-transition-radius')
```

### 32.4 检查系统偏好

```js
matchMedia('(prefers-color-scheme: dark)').matches
matchMedia('(prefers-reduced-motion: reduce)').matches
```

### 32.5 使用浏览器动画面板

浏览器 DevTools 的 Animations 面板可以放慢或暂停 CSS 动画。Rendering 面板可以帮助观察重绘和系统配色模拟。

## 33. 实施步骤总结

1. 定义 `light | dark` 主题类型；
2. 创建 Theme Context；
3. 从 LocalStorage 或系统偏好初始化；
4. 使用 `ConfigProvider` 切换 Ant Design 算法；
5. 在 `<html>` 写入 `data-theme` 和 `color-scheme`；
6. 为自定义 CSS 建立主题变量；
7. 从按钮 `currentTarget` 计算圆心；
8. 计算覆盖视口的最大半径；
9. View Transition 开始前写入 CSS 坐标和半径变量；
10. 在更新回调中使用 `flushSync` 更新 React；
11. 禁用浏览器默认快照动画；
12. 设置新旧快照 z-index；
13. 使用 CSS Keyframes 和 `both` 播放扩散/收缩；
14. 在 `transition.finished` 后清理变量和锁；
15. 为不支持 API 和减少动画的用户提供回退；
16. 检查所有自定义和第三方组件的深色样式；
17. 验证动画首帧、末帧和连续点击。

## 34. 结论

圆形主题切换的难点不在 `clip-path` 本身，而在 View Transition 新旧快照的创建时机、图层顺序和动画首尾状态。

最稳定的实现原则是：

- React 和根元素主题必须在同一个 View Transition 更新回调中同步完成；
- 动画参数在创建快照前写入 CSS 变量；
- 圆形动画直接绑定到 View Transition 伪元素，而不是等待 `transition.ready` 后再通过 JavaScript 添加；
- 使用 `animation-fill-mode: both` 锁定第一帧和最后一帧；
- 白天扩散操作新图层，黑夜反向收缩操作旧图层；
- 根据目标主题调整新旧伪元素 z-index；
- 动画只是渐进增强，任何失败都必须能够直接完成主题切换。

本文记录的两类闪烁问题分别来自末帧恢复和首帧异步挂载。把动画迁移到 CSS Keyframes 并使用 `both` 后，可以同时消除这两个时序窗口。

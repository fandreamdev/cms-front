# 纯前端文件导出需求分析与实现方案

## 1. 方案目标

本文讨论完全在浏览器中生成并下载 Word、PPT、PDF、Excel 等文件的方案。导出过程不调用后端导出接口，也不由服务器生成文件：

```text
页面已有数据
  → 转换为统一导出模型
  → 浏览器内的格式生成库
  → Blob/ArrayBuffer
  → 浏览器下载
```

纯前端导出适合以下场景：

- 数据已经加载到页面内存中；
- 数据来自打包的静态文件、用户输入、LocalStorage 或 IndexedDB；
- 导出数据量较小，文件结构和排版相对固定；
- 不希望维护后端文件生成服务；
- 可以接受浏览器兼容性、内存和性能限制。

## 2. 必须先明确的数据边界

“不调用后端接口”意味着前端只能导出浏览器当前已经拥有的数据。浏览器无法生成它没有获取到的记录。

以文章列表为例：

- 如果页面内存中只有当前页 10 篇文章，只能导出这 10 篇；
- 若要导出全部文章，必须事先将全部文章放在前端可访问的位置，例如构建时打包的 JSON、IndexedDB、本地文件或已经加载到内存的数据；
- 如果全部数据只存在数据库中，且前端从未取得这些数据，则无法在完全不调用后端接口的前提下导出全部文章；
- 已经通过普通查询接口取得的数据可以在前端生成文件，但这属于“不调用导出接口”，并不属于“完全不调用任何后端接口”。

因此，需求中必须区分两种含义：

1. **不调用后端导出接口**：数据仍可通过普通查询接口加载，文件由前端生成；
2. **完全不调用后端接口**：导出数据必须已经存在于浏览器、静态资源或用户选择的本地文件中。

本文后续实现同时适用于这两种情况，区别只在导出数据的来源。

## 3. 格式选型

浏览器本身只提供 Blob、ArrayBuffer 和下载能力，不提供 Word、PPT、PDF、Excel 的编码器，需要使用对应的 JavaScript 库。

| 格式          | 推荐库                     | 适合场景                         | 主要限制                                 |
| ------------- | -------------------------- | -------------------------------- | ---------------------------------------- |
| Word `.docx`  | `docx`                     | 标题、段落、表格、图片、页眉页脚 | HTML 不能无损转换，复杂排版需手工映射    |
| PPT `.pptx`   | `pptxgenjs`                | 一篇文章一页、图文汇报、图表     | 自动分页能力有限，需要计算布局           |
| PDF `.pdf`    | `jspdf`、`jspdf-autotable` | 文本、表格、图片、固定版式       | 中文字体需要嵌入，复杂 HTML 还原效果有限 |
| Excel `.xlsx` | `exceljs` 或 `xlsx`        | 表格、样式、公式、多工作表       | 大数据量时内存占用明显                   |
| CSV `.csv`    | 原生字符串和 Blob          | 简单二维数据、通用交换           | 不支持样式、多工作表和图片               |
| ZIP `.zip`    | `jszip`                    | 多文件打包下载                   | 压缩过程占用 CPU 和内存                  |

库的选择建议：

- Excel 只要求快速导出二维数据时选择 `xlsx`；要求单元格样式、冻结窗格、图片或更精细控制时选择 `exceljs`；
- PDF 是数据表格时使用 `jsPDF + AutoTable`；需要高度还原网页时可以使用 `html2canvas + jsPDF`，但文字会部分栅格化，文件更大且分页不稳定；
- Word 和 PPT 应基于结构化数据生成，不建议先截图再放入文件，否则文本不可搜索、不可编辑；
- 如果导出不是高频功能，使用动态 `import()` 加载这些库，避免增加首屏包体积。

示例依赖：

```bash
npm install docx pptxgenjs jspdf jspdf-autotable exceljs
```

项目可按实际需要只安装使用到的库。

## 4. 需求分析

### 4.1 功能需求

| 维度     | 需要确认的内容                                       |
| -------- | ---------------------------------------------------- |
| 数据范围 | 当前详情、当前页、勾选项、当前筛选结果或全部本地数据 |
| 文件格式 | Word、PPT、PDF、Excel，以及未来增加的格式            |
| 内容结构 | 标题、摘要、正文、图片、分类、标签、作者、时间       |
| 格式规则 | Word 章节结构、PPT 每页内容、PDF 版式、Excel 列定义  |
| 文件名   | 默认名称、时间戳、非法字符替换、重名处理             |
| 用户体验 | 导出中状态、取消、成功或失败提示、防止重复点击       |
| 兼容范围 | Chrome、Edge、Firefox、Safari 及最低版本             |

### 4.2 非功能需求

- 生成期间不能长时间阻塞页面交互；
- 中文字体和特殊字符必须正确显示；
- 图片加载失败时需要占位或跳过策略；
- 临时 Object URL 使用后必须释放；
- 文件扩展名、MIME 类型和实际文件内容必须一致；
- 对数据量和文件大小设定上限，超限时提示用户；
- 新增格式时不复制页面权限、状态和下载逻辑。

### 4.3 权限说明

纯前端权限控制只能决定按钮是否显示，不能形成真正的安全边界。只要数据已经到达浏览器，用户就可能通过开发者工具读取或保存它。

因此：

- `article:view` 可以控制详情页导出按钮显隐；
- `article:list` 可以控制列表导出按钮显隐；
- 敏感数据不应仅依赖前端权限隐藏；
- 不允许导出的字段不应提前发送或存储在浏览器中。

## 5. 推荐的代码分层

```text
页面组件
  ├─ 检查权限
  ├─ 选择格式和数据范围
  ├─ 展示生成状态
  └─ 调用 exportDocument
       ├─ WordAdapter
       ├─ PptAdapter
       ├─ PdfAdapter
       └─ ExcelAdapter
            → Blob
            → downloadBlob
```

页面不应直接包含大量文件排版代码。不同格式放在独立适配器中，共享数据模型和下载方法。

建议目录：

```text
src/features/export/
  exportTypes.ts
  exportDocument.ts
  wordExporter.ts
  pptExporter.ts
  pdfExporter.ts
  excelExporter.ts
  fontLoader.ts
src/utils/download.ts
```

## 6. 统一导出数据模型

先将页面数据转换成与 UI、接口字段无关的导出模型：

```ts
export interface ExportArticle {
  id: number
  title: string
  summary?: string
  contentText: string
  author?: string
  category?: string
  tags: string[]
  coverDataUrl?: string
  createdAt?: string
}

export type ClientExportFormat = 'word' | 'ppt' | 'pdf' | 'excel'
```

富文本正文建议同时准备纯文本或结构化节点。直接把 HTML 字符串传给 Word、PPT 或 PDF 库，通常无法得到可靠结果。可以用 DOMParser 提取纯文本：

```ts
export function htmlToText(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  return document.body.textContent?.trim() ?? ''
}
```

如果需要保留标题、列表、粗体、图片等样式，应将 HTML 转成受支持的中间节点，再由每种格式的适配器分别映射。

## 7. 通用浏览器下载

所有格式最终都转换成 Blob，再使用统一方法下载：

```ts
export function downloadBlob(blob: Blob, filename: string) {
  const filenameWithoutControls = [...filename]
    .map((character) => (character.charCodeAt(0) < 32 ? '_' : character))
    .join('')
  const safeFilename = filenameWithoutControls.replace(/[\\/:*?"<>|]/g, '_')
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
```

纯前端生成没有 HTTP `Content-Disposition` 响应头，文件名由前端直接指定。

## 8. Word 导出

`docx` 可以直接在浏览器生成 Office Open XML 文件。

```ts
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { ExportArticle } from './exportTypes'
import { downloadBlob } from '../../utils/download'

export async function exportArticleWord(article: ExportArticle) {
  const document = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: article.title, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [new TextRun({ text: article.summary ?? '', italics: true })],
          }),
          ...article.contentText
            .split(/\n+/)
            .filter(Boolean)
            .map((text) => new Paragraph({ text })),
          new Paragraph({ text: `作者：${article.author ?? '-'}` }),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(document)
  downloadBlob(blob, `${article.title}.docx`)
}
```

扩展能力：

- 使用 `Table`、`TableRow`、`TableCell` 生成表格；
- 使用 `ImageRun` 插入图片，图片必须先转成 ArrayBuffer；
- 使用 `Header`、`Footer`、页码和 Section 设置页面；
- 复杂 HTML 需要自己映射到 Paragraph、TextRun、Table 等节点。

## 9. PPT 导出

`pptxgenjs` 适合按结构化数据创建幻灯片。若需求是“每页对应一篇文章”，可以对本地文章数组逐项创建 Slide。

```ts
import pptxgen from 'pptxgenjs'
import type { ExportArticle } from './exportTypes'
import { downloadBlob } from '../../utils/download'

export async function exportArticlesPpt(articles: ExportArticle[]) {
  const ppt = new pptxgen()
  ppt.layout = 'LAYOUT_WIDE'
  ppt.author = 'CMS'
  ppt.subject = '文章导出'
  ppt.title = '全部文章'

  for (const article of articles) {
    const slide = ppt.addSlide()
    slide.background = { color: 'F7F9FC' }
    slide.addText(article.title, {
      x: 0.7,
      y: 0.5,
      w: 11.9,
      h: 0.6,
      fontSize: 26,
      bold: true,
      color: '1F2937',
    })
    slide.addText(article.summary || article.contentText, {
      x: 0.7,
      y: 1.4,
      w: 11.9,
      h: 5.2,
      fontSize: 16,
      valign: 'top',
      color: '374151',
      margin: 0.08,
    })
    slide.addText(`作者：${article.author ?? '-'}  分类：${article.category ?? '-'}`, {
      x: 0.7,
      y: 6.7,
      w: 11.9,
      h: 0.3,
      fontSize: 10,
      color: '6B7280',
    })
  }

  const blob = await ppt.write({ outputType: 'blob' })
  downloadBlob(blob as Blob, '全部文章.pptx')
}
```

注意事项：

- PPT 使用英寸坐标，需要预先定义版式、边距和字号；
- 文本超出文本框时不会自动得到理想分页，应截断、缩小字号或续到下一页；
- 图片建议提前转成 Data URL，并设置 `sizingContain` 或 `sizingCrop`；
- 中文显示依赖打开 PPT 的设备字体，必要时统一使用常见字体。

## 10. PDF 导出

### 10.1 文本和表格

`jsPDF` 适合程序化生成固定版式；`jspdf-autotable` 适合二维数据。

```ts
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { ExportArticle } from './exportTypes'
import { downloadBlob } from '../../utils/download'

export function exportArticlesPdf(articles: ExportArticle[]) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })

  autoTable(pdf, {
    head: [['标题', '作者', '分类', '创建时间']],
    body: articles.map((article) => [
      article.title,
      article.author ?? '-',
      article.category ?? '-',
      article.createdAt ?? '-',
    ]),
    styles: { font: 'NotoSansSC', fontSize: 9 },
  })

  downloadBlob(pdf.output('blob'), '全部文章.pdf')
}
```

上述代码使用了 `NotoSansSC` 字体名称，实际使用前必须把对应 TTF 文件转换或读取为 Base64，再通过 `addFileToVFS` 和 `addFont` 注册。jsPDF 的内置字体通常不能正确显示中文。

### 10.2 网页截图式 PDF

如果要求尽量接近页面视觉，可以使用 `html2canvas` 将 DOM 渲染成 Canvas，再把图片切分到 PDF。此方案存在以下问题：

- 文本可能变成图片，不可搜索和复制；
- 长页面分页容易切断文字和表格；
- 文件体积较大，高清截图内存消耗高；
- 跨域图片和字体可能因为 CORS 无法渲染；
- 浏览器 CSS 与 Canvas 渲染效果可能不一致。

因此，报表和正式文档更推荐结构化生成；“所见即所得”的简单页面才考虑截图式 PDF。

## 11. Excel 导出

`exceljs` 可以在浏览器中生成工作簿，并控制列宽、样式、冻结窗格和自动筛选。

```ts
import ExcelJS from 'exceljs'
import type { ExportArticle } from './exportTypes'
import { downloadBlob } from '../../utils/download'

export async function exportArticlesExcel(articles: ExportArticle[]) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('文章')

  sheet.columns = [
    { header: 'ID', key: 'id', width: 10 },
    { header: '标题', key: 'title', width: 32 },
    { header: '摘要', key: 'summary', width: 50 },
    { header: '作者', key: 'author', width: 16 },
    { header: '分类', key: 'category', width: 16 },
    { header: '标签', key: 'tags', width: 24 },
    { header: '创建时间', key: 'createdAt', width: 22 },
  ]

  sheet.addRows(
    articles.map((article) => ({
      id: article.id,
      title: article.title,
      summary: article.summary ?? '',
      author: article.author ?? '',
      category: article.category ?? '',
      tags: article.tags.join('、'),
      createdAt: article.createdAt ?? '',
    })),
  )

  sheet.views = [{ state: 'frozen', ySplit: 1 }]
  sheet.autoFilter = { from: 'A1', to: 'G1' }
  sheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  downloadBlob(blob, '全部文章.xlsx')
}
```

写入外部或用户输入的数据时，需要防止 Excel 公式注入。以 `=`, `+`, `-`, `@` 开头的文本可能被 Excel 当作公式，应按业务要求加单引号或显式设置为普通字符串。

## 12. 统一入口与动态加载

为了避免首页同时加载所有导出库，可以在用户点击时动态导入：

```ts
import type { ClientExportFormat, ExportArticle } from './exportTypes'

export async function exportArticles(format: ClientExportFormat, articles: ExportArticle[]) {
  switch (format) {
    case 'word': {
      if (articles.length !== 1) throw new Error('Word 详情导出需要一篇文章')
      const { exportArticleWord } = await import('./wordExporter')
      return exportArticleWord(articles[0])
    }
    case 'ppt': {
      const { exportArticlesPpt } = await import('./pptExporter')
      return exportArticlesPpt(articles)
    }
    case 'pdf': {
      const { exportArticlesPdf } = await import('./pdfExporter')
      return exportArticlesPdf(articles)
    }
    case 'excel': {
      const { exportArticlesExcel } = await import('./excelExporter')
      return exportArticlesExcel(articles)
    }
  }
}
```

页面调用时统一处理加载状态：

```ts
const [exporting, setExporting] = useState<ClientExportFormat | null>(null)

const handleExport = async (format: ClientExportFormat, articles: ExportArticle[]) => {
  if (exporting) return

  setExporting(format)
  try {
    await exportArticles(format, articles)
    message.success('导出成功')
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导出失败')
  } finally {
    setExporting(null)
  }
}
```

## 13. 图片与字体

纯前端导出最常见的问题来自图片和字体。

### 13.1 图片

- 同源图片可以使用 `fetch` 读取成 Blob，再转 ArrayBuffer 或 Data URL；
- 跨域图片必须由图片服务器允许 CORS，否则 Canvas 会被污染，导出可能失败；
- Base64 图片会增加内存和文件体积，应在导出前压缩并限制尺寸；
- 图片加载失败时应跳过或使用本地占位图，不能让整个导出任务永久等待。

示例：

```ts
export async function imageUrlToDataUrl(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('图片加载失败')
  const blob = await response.blob()

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
```

这里的 `fetch` 是读取图片资源。如果需求连静态资源请求也不允许，则图片必须已经以内联 Data URL、用户本地文件或打包资源的形式存在。

### 13.2 字体

- PDF 中文字体通常需要嵌入文件；
- 字体文件可能达到数 MB，建议仅在导出 PDF 时动态加载；
- Word/PPT 通常记录字体名称，并依赖打开文件的设备安装对应字体；
- 字体授权必须允许在生成文档或应用中嵌入。

## 14. 性能与浏览器限制

纯前端导出会同时占用浏览器 CPU 和内存。生成文件时，原始数据、图片 Base64、库内部结构、ArrayBuffer 和最终 Blob 可能同时存在，峰值内存远大于最终文件大小。

建议：

- 限制单次导出的文章数量、图片数量和图片分辨率；
- 导出前估算数据量，超限时明确提示；
- 使用动态导入减少初始包体积；
- 大量数据转换放到 Web Worker，避免阻塞主线程；
- 分批处理图片，并及时释放不再使用的引用；
- 支持 `AbortController` 或自定义取消标记；
- 不要依赖浏览器 Blob 方案生成数百 MB 的文件；
- Safari、移动端浏览器对内存和自动下载限制更严格，需要单独验证。

Web Worker 只能解决主线程卡顿，不能降低数据和最终 Blob 的总体内存需求。超大文件、复杂模板、高并发或需要审计的正式报表，仍更适合服务端生成。

## 15. 失败处理

纯前端导出没有 HTTP 错误，但需要处理：

- 导出数据为空；
- 库动态加载失败；
- 图片或字体加载失败；
- 数据格式不合法；
- 文本超过 Word/PPT/PDF 版面；
- 浏览器内存不足；
- 用户取消；
- 浏览器阻止下载；
- 文件生成成功但内容软件无法打开。

页面应使用 `try/catch/finally`，保证失败后恢复按钮状态。错误提示应区分“没有数据”“资源加载失败”“文件生成失败”，便于用户处理。

## 16. 测试与验收

### 16.1 数据范围

- 当前详情只导出当前文章；
- 当前页导出只包含当前页数据；
- 全部导出确实传入了全部本地数据，而不是当前分页数据；
- 空数组、缺失字段、超长正文和大量文章有明确行为。

### 16.2 文件正确性

- Word、PPT、PDF、Excel 可以被对应软件正常打开；
- 扩展名、MIME 类型和实际内容一致；
- 中文、Emoji、换行和特殊符号显示正确；
- Excel 列顺序、日期、数字和文本类型正确；
- PPT 一篇文章一页，超长内容按约定截断或分页；
- PDF 中文字体已注册，内容没有乱码；
- 图片清晰且不变形，加载失败策略生效。

### 16.3 交互与性能

- 没有权限时不显示按钮；
- 导出期间显示加载状态并防止重复点击；
- 成功和失败都有反馈；
- Object URL 被释放；
- 目标数据规模下页面不会长时间无响应；
- Chrome、Edge、Firefox、Safari 按项目支持范围完成验证。

### 16.4 建议的自动化测试

- 单元测试数据到导出模型的转换；
- 单元测试安全文件名和 Excel 公式转义；
- 对生成结果检查 ZIP 文件签名和关键内部文件：`.docx`、`.pptx`、`.xlsx` 本质上是 ZIP 容器；
- PDF 检查文件头 `%PDF-`；
- 端到端测试按钮权限、加载状态和下载事件；
- 使用固定输入生成文件并做结构级快照，不建议直接比较完整二进制，因为时间戳等元数据可能变化。

## 17. 实施建议

推荐按以下顺序落地：

1. 明确每种格式的数据范围、模板和最大数据量；
2. 建立 `ExportArticle` 等统一导出模型；
3. 保留或完善通用 `downloadBlob`；
4. 优先实现 Excel，再实现 Word、PPT 和 PDF 适配器；
5. 使用动态导入控制包体积；
6. 补充中文字体、图片加载和内容溢出策略；
7. 在真实数据规模和目标浏览器中验证性能；
8. 数据量超过前端能力时，重新评估是否允许异步后端导出。

纯前端方案可以避免导出接口和服务器生成逻辑，但代价是数据必须提前存在于浏览器中，且文件生成消耗用户设备资源。对于中小规模、模板固定的导出任务，`docx`、`pptxgenjs`、`jsPDF` 和 `exceljs` 能够覆盖 Word、PPT、PDF、Excel 的主要需求；对于超大数据、复杂排版或严格一致性场景，应在需求阶段明确纯前端方案的能力边界。

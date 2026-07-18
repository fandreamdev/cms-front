# Home 仪表盘与系统实时监控后端变更要求

## 1. 背景

管理后台 Home 页面已升级为数据仪表盘，展示：

- 网站名称、网站描述和联系邮箱；
- 文章、分类、标签、用户、角色、权限资源、网站设置数量；
- 各模块最近 7 天相较此前 7 天的新增数量增长率；
- 文章审批状态分布；
- 文章上架状态分布；
- 最近更新的文章、分类、标签、用户、角色、权限资源和网站设置；
- 当前配置城市的天气、温度、体感温度、湿度和风速；
- 独立系统状态页展示逐核心 CPU、全部磁盘分区、全部网卡、内存、Node 进程和运行时长；
- 根据用户权限生成的快捷操作。

图表由前端使用 Recharts 渲染，后端只需要提供统计数据，不需要生成图片或图表配置。

当前前端可以通过现有列表接口计算统计结果，但文章审批状态、发布状态和各模块数量会产生多次并发请求。为了降低请求数量和数据库查询开销，推荐增加仪表盘聚合接口。

## 2. 当前前端使用的统计口径

| 仪表盘区域               | 当前数据来源                                                       | 权限             |
| ------------------------ | ------------------------------------------------------------------ | ---------------- |
| 网站名称、描述、联系邮箱 | `GET /api/settings/public`                                         | 公开接口         |
| 当前天气                 | `GET /api/dashboard/weather`                                       | 登录用户         |
| 服务器首屏快照           | `GET /api/dashboard/system`                                        | `system:monitor` |
| WebSocket 临时票据       | `POST /api/dashboard/system/socket-ticket`                         | `system:monitor` |
| 服务器实时状态           | `WS /api/dashboard/system/stream?ticket=...`                       | `system:monitor` |
| 文章总数和最新文章       | `GET /api/articles?page=1&pageSize=5&orderBy=updatedAt&order=desc` | `article:list`   |
| 各审批状态数量           | 分别按 `approvalStatus` 请求文章列表                               | `article:list`   |
| 上架/下架数量            | 分别按 `status=1/0` 请求文章列表                                   | `article:list`   |
| 分类数量                 | `GET /api/categories/tree` 后递归计数                              | `category:list`  |
| 标签数量和最新标签       | `GET /api/tags?page=1&pageSize=5&orderBy=updatedAt&order=desc`     | `tag:list`       |
| 用户数量和最新用户       | `GET /api/users?page=1&pageSize=5&orderBy=updatedAt&order=desc`    | `user:list`      |
| 角色数量和最新角色       | `GET /api/roles?page=1&pageSize=5&orderBy=updatedAt&order=desc`    | `role:list`      |
| 分类和最新分类           | `GET /api/categories/tree` 后递归处理                              | `category:list`  |
| 权限资源和最新资源       | `GET /api/accesses/tree` 后递归处理                                | `access:list`    |
| 网站设置和最新设置       | `GET /api/settings`                                                | `setting:list`   |

现有接口继续保持兼容即可支持当前页面，但一次完整的超级管理员仪表盘加载可能产生十余个请求。因此建议使用下述聚合接口替代统计类列表请求。

为了计算增长率，当前前端还会对文章、标签、用户和角色分别请求当前周期与上一周期的新增数量。聚合接口落地后应一并替代这些额外请求。

## 3. 推荐新增接口

```http
GET /api/dashboard/overview
Authorization: Bearer <accessToken>
```

接口必须登录，但不建议新增统一的 `dashboard:view` 权限。后端应根据当前用户已经拥有的模块列表权限裁剪响应，避免通过仪表盘泄露无权查看模块的数量。

超级管理员沿用现有 `isSuper` 放行规则，可以获得全部统计字段。

响应继续使用项目统一结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

## 4. 推荐响应结构

```ts
type ArticleApprovalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'withdrawn'

interface DashboardRecentArticle {
  id: number
  title: string
  approvalStatus: ArticleApprovalStatus
  category: {
    id: number
    name: string
  } | null
  updatedAt: string
}

interface DashboardRecentNamedItem {
  id: number
  name: string
  description: string | null
  updatedAt: string
}

interface DashboardRecentUser {
  id: number
  username: string
  status: 0 | 1
  updatedAt: string
}

interface DashboardRecentAccess {
  id: number
  type: 'module' | 'menu' | 'feature'
  url: string
  description: string
  updatedAt: string
}

interface DashboardRecentSetting {
  key: string
  isPublic: boolean
  description: string | null
  updatedAt: string
}

interface DashboardGrowthMetric {
  current: number
  previous: number
  rate: number | null
  trend: 'up' | 'down' | 'flat'
}

interface DashboardOverview {
  generatedAt: string
  metrics: {
    articles?: number
    categories?: number
    tags?: number
    users?: number
    roles?: number
    accesses?: number
    settings?: number
  }
  growth: {
    periodDays: 7
    currentFrom: string
    currentTo: string
    previousFrom: string
    articles?: DashboardGrowthMetric
    categories?: DashboardGrowthMetric
    tags?: DashboardGrowthMetric
    users?: DashboardGrowthMetric
    roles?: DashboardGrowthMetric
    accesses?: DashboardGrowthMetric
    settings?: DashboardGrowthMetric
  }
  articles?: {
    approval: Record<ArticleApprovalStatus, number>
    publication: {
      offline: number
      online: number
    }
  }
  recent: {
    articles?: DashboardRecentArticle[]
    categories?: DashboardRecentNamedItem[]
    tags?: DashboardRecentNamedItem[]
    users?: DashboardRecentUser[]
    roles?: Array<Pick<DashboardRecentNamedItem, 'id' | 'name' | 'updatedAt'>>
    accesses?: DashboardRecentAccess[]
    settings?: DashboardRecentSetting[]
  }
}
```

完整权限用户的响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "generatedAt": "2026-07-18T08:00:00.000Z",
    "metrics": {
      "articles": 128,
      "categories": 16,
      "tags": 42,
      "users": 25,
      "roles": 6,
      "accesses": 48,
      "settings": 3
    },
    "growth": {
      "periodDays": 7,
      "currentFrom": "2026-07-11T08:00:00.000Z",
      "currentTo": "2026-07-18T08:00:00.000Z",
      "previousFrom": "2026-07-04T08:00:00.000Z",
      "articles": {
        "current": 14,
        "previous": 10,
        "rate": 40,
        "trend": "up"
      },
      "tags": {
        "current": 3,
        "previous": 0,
        "rate": null,
        "trend": "up"
      },
      "users": {
        "current": 2,
        "previous": 4,
        "rate": -50,
        "trend": "down"
      }
    },
    "articles": {
      "approval": {
        "draft": 20,
        "pending": 8,
        "approved": 82,
        "rejected": 10,
        "withdrawn": 8
      },
      "publication": {
        "offline": 46,
        "online": 82
      }
    },
    "recent": {
      "articles": [
        {
          "id": 128,
          "title": "产品更新公告",
          "approvalStatus": "approved",
          "category": {
            "id": 3,
            "name": "公告"
          },
          "updatedAt": "2026-07-18T07:30:00.000Z"
        }
      ],
      "tags": [
        {
          "id": 18,
          "name": "React",
          "description": "React 技术文章",
          "updatedAt": "2026-07-18T07:20:00.000Z"
        }
      ],
      "users": [
        {
          "id": 25,
          "username": "editor",
          "status": 1,
          "updatedAt": "2026-07-18T07:10:00.000Z"
        }
      ]
    }
  }
}
```

## 5. 权限裁剪规则

| 响应字段             | 所需权限        |
| -------------------- | --------------- |
| `metrics.articles`   | `article:list`  |
| `articles`           | `article:list`  |
| `metrics.categories` | `category:list` |
| `metrics.tags`       | `tag:list`      |
| `metrics.users`      | `user:list`     |
| `metrics.roles`      | `role:list`     |
| `metrics.accesses`   | `access:list`   |
| `metrics.settings`   | `setting:list`  |
| `recent.articles`    | `article:list`  |
| `recent.categories`  | `category:list` |
| `recent.tags`        | `tag:list`      |
| `recent.users`       | `user:list`     |
| `recent.roles`       | `role:list`     |
| `recent.accesses`    | `access:list`   |
| `recent.settings`    | `setting:list`  |
| `growth.articles`    | `article:list`  |
| `growth.categories`  | `category:list` |
| `growth.tags`        | `tag:list`      |
| `growth.users`       | `user:list`     |
| `growth.roles`       | `role:list`     |
| `growth.accesses`    | `access:list`   |
| `growth.settings`    | `setting:list`  |

用户没有某项权限时，应直接省略对应字段，而不是返回真实数量后依赖前端隐藏。

例如只有文章和分类列表权限的用户：

```json
{
  "generatedAt": "2026-07-18T08:00:00.000Z",
  "metrics": {
    "articles": 128,
    "categories": 16
  },
  "growth": {
    "periodDays": 7,
    "currentFrom": "2026-07-11T08:00:00.000Z",
    "currentTo": "2026-07-18T08:00:00.000Z",
    "previousFrom": "2026-07-04T08:00:00.000Z",
    "articles": {
      "current": 14,
      "previous": 10,
      "rate": 40,
      "trend": "up"
    },
    "categories": {
      "current": 1,
      "previous": 1,
      "rate": 0,
      "trend": "flat"
    }
  },
  "articles": {
    "approval": {
      "draft": 20,
      "pending": 8,
      "approved": 82,
      "rejected": 10,
      "withdrawn": 8
    },
    "publication": {
      "offline": 46,
      "online": 82
    }
  },
  "recent": {
    "articles": [],
    "categories": []
  }
}
```

权限裁剪后的正常响应仍返回 HTTP 200。只有未登录或 Token 无效时返回 HTTP 401。

## 6. 统计口径

### 6.1 文章

- `metrics.articles`：文章表全部记录数量；
- `approval.draft`：`approvalStatus = 'draft'`；
- `approval.pending`：`approvalStatus = 'pending'`；
- `approval.approved`：`approvalStatus = 'approved'`；
- `approval.rejected`：`approvalStatus = 'rejected'`；
- `approval.withdrawn`：`approvalStatus = 'withdrawn'`；
- `publication.offline`：`status = 0`；
- `publication.online`：`status = 1`。

应满足：

```text
articles = draft + pending + approved + rejected + withdrawn
articles = offline + online
```

如果存在历史脏数据或新增状态，后端应先完成数据迁移或同步扩展响应枚举，不能让图表总数静默不一致。

### 6.2 最新数据

- 每个有权限的模块默认最多返回 5 条；
- 统一按 `updatedAt DESC` 排序；使用数字 ID 的表再按 `id DESC` 排序，设置使用 `key ASC` 作为相同时间的稳定排序；
- 只返回仪表盘展示需要的字段；
- 最新文章的分类被删除或不存在时允许 `category: null`；
- 最新文章不返回正文、封面、拒绝原因等大字段；
- 最新用户不返回手机号、邮箱、密码、Token 和角色权限明细；
- 最新设置不返回 `value`，避免私有配置和密钥泄露；
- 每个 `recent` 子字段与对应模块列表权限保持一致；
- 没有权限时省略字段，有权限但没有数据时返回空数组。

现有分页接口需要为仪表盘提供可选排序参数：

```http
GET /api/articles?orderBy=updatedAt&order=desc
GET /api/tags?orderBy=updatedAt&order=desc
GET /api/users?orderBy=updatedAt&order=desc
GET /api/roles?orderBy=updatedAt&order=desc
```

`orderBy` 当前只允许 `updatedAt`，`order` 只允许 `asc` 或 `desc`。非法字段应返回 HTTP 400，不能把客户端字符串直接拼入 SQL `ORDER BY`。

### 6.3 增长率

增长率统计的是模块新增记录数，而不是总量本身的变化。

默认使用两个连续的滚动 7 天区间：

```text
当前周期：[currentFrom, currentTo)
上一周期：[previousFrom, currentFrom)
```

所有时间使用 UTC ISO 8601。左边界包含，右边界不包含，避免边界时间被重复统计。

计算公式：

```text
rate = (current - previous) / previous × 100
```

结果保留一位小数。特殊情况：

| current | previous | rate   | trend  | 前端展示     |
| ------- | -------- | ------ | ------ | ------------ |
| 14      | 10       | `40`   | `up`   | `↑ 40%`      |
| 2       | 4        | `-50`  | `down` | `↓ 50%`      |
| 3       | 0        | `null` | `up`   | `本期新增 3` |
| 0       | 0        | `0`    | `flat` | `— 0%`       |
| 0       | 3        | `-100` | `down` | `↓ 100%`     |

当上一周期为零、当前周期大于零时，不能返回 `Infinity`、字符串百分比或任意极大数，应返回 `rate: null`。

`trend` 只根据新增数量比较：

```text
current > previous  → up
current < previous  → down
current = previous  → flat
```

当前分页接口需要支持创建时间范围参数，以便聚合接口切换前计算计数：

```http
GET /api/articles?page=1&pageSize=1&createdFrom=<ISO>&createdTo=<ISO>
GET /api/tags?page=1&pageSize=1&createdFrom=<ISO>&createdTo=<ISO>
GET /api/users?page=1&pageSize=1&createdFrom=<ISO>&createdTo=<ISO>
GET /api/roles?page=1&pageSize=1&createdFrom=<ISO>&createdTo=<ISO>
```

查询条件为：

```sql
createdAt >= :createdFrom AND createdAt < :createdTo
```

参数必须是有效 ISO 8601 时间，且 `createdFrom < createdTo`。非法参数返回 HTTP 400。

### 6.4 分类

`metrics.categories` 是所有分类节点数量，包含根分类和全部子分类。不要只统计根节点数量。

### 6.5 权限资源

`metrics.accesses` 是资源表全部节点数量，包含 `module`、`menu` 和 `feature`。

### 6.6 网站设置

`metrics.settings` 是 `website_settings` 集合的记录总数，包括公开和私有设置，但只有拥有 `setting:list` 权限的用户可以获得该数量。

该统计只返回数量，不能返回任何设置值，尤其不能返回令牌和第三方密钥。

## 7. 服务器监控接口要求

```http
GET /api/dashboard/system
Authorization: Bearer <accessToken>
```

接口需要新增 `system:monitor` 权限。超级管理员沿用 `isSuper: true` 放行；普通用户必须由角色明确获得该权限。

服务器监控可能暴露基础设施规模、主机名称和资源使用情况，不能仅依赖前端隐藏。

### 7.1 响应结构

```ts
interface DashboardSystemStatus {
  status: 'healthy' | 'warning' | 'critical'
  sampledAt: string
  instance: {
    id: string
    hostname: string
    platform: string
    arch: string
    release: string
    uptime: number
    virtualization?: string | null
    containerized?: boolean
  }
  cpu: {
    usage: number
    cores: number
    physicalCores?: number | null
    model: string
    speedMHz?: number | null
    temperature?: number | null
    loadAverage: [number, number, number]
    perCore: Array<{
      index: number
      usage: number
      speedMHz?: number | null
      temperature?: number | null
    }>
  }
  memory: {
    total: number
    used: number
    available: number
    free: number
    active?: number | null
    cached?: number | null
    buffers?: number | null
    usage: number
    swap: {
      total: number
      used: number
      free: number
      usage: number
    }
  }
  disks: Array<{
    device: string
    mount: string
    filesystem?: string | null
    type?: string | null
    total: number
    used: number
    available: number
    usage: number
    readPerSecond?: number | null
    writePerSecond?: number | null
    readIops?: number | null
    writeIops?: number | null
  }>
  network: {
    inboundPerSecond: number
    outboundPerSecond: number
    totalReceived?: number | null
    totalSent?: number | null
    interfaces: Array<{
      name: string
      state: 'up' | 'down' | 'unknown'
      type?: string | null
      speedMbps?: number | null
      inboundPerSecond: number
      outboundPerSecond: number
      totalReceived?: number | null
      totalSent?: number | null
    }>
  }
  process: {
    uptime: number
    cpuUsage: number
    rss: number
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
    nodeVersion: string
    activeHandles?: number | null
    activeRequests?: number | null
    eventLoopLag?: number | null
  }
  history: Array<{
    sampledAt: string
    cpuUsage: number
    memoryUsage: number
    inboundPerSecond: number
    outboundPerSecond: number
    diskReadPerSecond?: number | null
    diskWritePerSecond?: number | null
  }>
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "healthy",
    "sampledAt": "2026-07-18T08:00:00.000Z",
    "instance": {
      "id": "cms-api-01",
      "hostname": "cms-api-01",
      "platform": "linux",
      "arch": "x64",
      "release": "6.8.0",
      "uptime": 864320,
      "virtualization": "docker",
      "containerized": true
    },
    "cpu": {
      "usage": 36.8,
      "cores": 8,
      "physicalCores": 4,
      "model": "Intel Xeon Gold 6338N",
      "speedMHz": 2200,
      "temperature": 52.4,
      "loadAverage": [1.42, 1.18, 0.96],
      "perCore": [
        { "index": 0, "usage": 28.4, "speedMHz": 2195, "temperature": 51.8 },
        { "index": 1, "usage": 45.2, "speedMHz": 2200, "temperature": 52.4 }
      ]
    },
    "memory": {
      "total": 17179869184,
      "used": 9663676416,
      "available": 7516192768,
      "free": 3221225472,
      "active": 8053063680,
      "cached": 3758096384,
      "buffers": 268435456,
      "usage": 56.25,
      "swap": {
        "total": 4294967296,
        "used": 268435456,
        "free": 4026531840,
        "usage": 6.25
      }
    },
    "disks": [
      {
        "device": "/dev/nvme0n1p1",
        "mount": "/",
        "filesystem": "ext4",
        "type": "NVMe",
        "total": 536870912000,
        "used": 214748364800,
        "available": 322122547200,
        "usage": 40,
        "readPerSecond": 15728640,
        "writePerSecond": 6291456,
        "readIops": 126,
        "writeIops": 48
      }
    ],
    "network": {
      "inboundPerSecond": 1258291,
      "outboundPerSecond": 734003,
      "totalReceived": 128849018880,
      "totalSent": 85899345920,
      "interfaces": [
        {
          "name": "eth0",
          "state": "up",
          "type": "wired",
          "speedMbps": 1000,
          "inboundPerSecond": 1258291,
          "outboundPerSecond": 734003,
          "totalReceived": 128849018880,
          "totalSent": 85899345920
        }
      ]
    },
    "process": {
      "uptime": 43210,
      "cpuUsage": 4.8,
      "rss": 268435456,
      "heapUsed": 125829120,
      "heapTotal": 201326592,
      "external": 18874368,
      "arrayBuffers": 4194304,
      "nodeVersion": "v24.4.0",
      "activeHandles": 18,
      "activeRequests": 2,
      "eventLoopLag": 8.4
    },
    "history": [
      {
        "sampledAt": "2026-07-18T07:59:00.000Z",
        "cpuUsage": 32.1,
        "memoryUsage": 55.8,
        "inboundPerSecond": 1048576,
        "outboundPerSecond": 524288,
        "diskReadPerSecond": 12582912,
        "diskWritePerSecond": 5242880
      },
      {
        "sampledAt": "2026-07-18T08:00:00.000Z",
        "cpuUsage": 36.8,
        "memoryUsage": 56.25,
        "inboundPerSecond": 1258291,
        "outboundPerSecond": 734003,
        "diskReadPerSecond": 15728640,
        "diskWritePerSecond": 6291456
      }
    ]
  }
}
```

为缩短示例，`cpu.perCore` 只展示了两个元素。实际响应必须为每个可用逻辑核心返回一项，并满足 `cpu.perCore.length === cpu.cores`，`index` 从 0 连续编号。

### 7.2 单位和范围

| 字段                   | 单位或范围               |
| ---------------------- | ------------------------ |
| CPU、内存、磁盘使用率  | `0–100` 的数值，不带 `%` |
| 内存、磁盘、网络累计量 | 字节                     |
| 网络实时速率           | 字节/秒                  |
| CPU 频率               | MHz                      |
| CPU 温度               | 摄氏度                   |
| 磁盘 IOPS              | 次/秒                    |
| 网卡链路速度           | Mbps                     |
| 运行时长               | 秒                       |
| 事件循环延迟           | 毫秒                     |
| `sampledAt`            | UTC ISO 8601             |

所有数值必须是有限 Number，不能返回 `NaN`、`Infinity`、带单位字符串或负数。采集不到的可选数据使用 `null`。

### 7.3 健康状态规则

建议默认阈值：

| 指标           | healthy   | warning     | critical   |
| -------------- | --------- | ----------- | ---------- |
| CPU 使用率     | `< 75%`   | `75–89.9%`  | `>= 90%`   |
| 内存使用率     | `< 75%`   | `75–89.9%`  | `>= 90%`   |
| 任一磁盘使用率 | `< 75%`   | `75–89.9%`  | `>= 90%`   |
| 事件循环延迟   | `< 100ms` | `100–499ms` | `>= 500ms` |

总体 `status` 取所有指标中的最高严重级别。阈值应支持环境变量配置，但响应结构保持不变。

### 7.4 历史数据

- 每 3 秒采集一次，与前端刷新周期一致；
- 默认保留最近 60 个点，展示约 3 分钟的实时趋势；
- 按 `sampledAt ASC` 返回；
- 服务刚启动、历史不足时允许返回 1–59 个点；
- 不能为了响应接口而同步等待采集；
- 可以使用进程内环形缓冲区、Redis 时序列表或监控系统查询。

如果使用进程内缓冲区，实例重启后历史清空属于正常行为。

### 7.5 采集实现

Node.js 可以结合：

- `node:os`：主机名、平台、架构、运行时长、负载；
- `process.memoryUsage()`：Node 进程内存；
- `process.uptime()`：进程运行时长；
- `node:perf_hooks`：事件循环延迟；
- `systeminformation` 等成熟库：CPU 使用率、磁盘和网络速率。

CPU 使用率不能直接等同于 Load Average。应通过两个采样点的 CPU 时间差或成熟系统信息库计算。

逐核心 CPU 要求：

- `perCore` 必须包含容器或进程实际可用的所有逻辑核心；
- 每个核心独立计算相邻采样区间内的 busy/total 时间差；
- 动态调频时 `speedMHz` 返回当前频率，读取不到时返回 `null`；
- 温度传感器不支持逐核心时，各核心温度可以为 `null`，总温度放在 `cpu.temperature`；
- 不得把同一个总体使用率复制到所有核心。

磁盘要求：

- `disks` 每一项对应一个实际展示的盘符、分区或挂载点；
- Windows 使用 `C:`、`D:` 等盘符作为 `mount`，Linux 使用 `/`、`/data` 等挂载点；
- `device` 返回磁盘或分区设备标识，`filesystem` 返回 NTFS、ext4、xfs 等文件系统；
- 排除 `tmpfs`、`devtmpfs`、loop、只读系统伪挂载等无业务意义的设备；
- 读写速率和 IOPS 必须由相邻采样累计量计算，读取不到时返回 `null`，不能伪造为 0。

网络速率需要通过累计字节计数的时间差计算：

```text
bytesPerSecond = (currentBytes - previousBytes) / elapsedSeconds
```

需要处理计数器重置、网卡变化、系统重启和负差值。

`network.interfaces` 每项对应一个网卡。应过滤 loopback 和无意义的虚拟接口；聚合的 `network.inboundPerSecond`、`outboundPerSecond` 应等于当前纳入展示网卡的速率之和。不得返回 IP、MAC、DNS、网关和路由表。

### 7.6 容器环境

- 优先返回容器可用的 CPU 和内存限制，而不是物理宿主机全部资源；
- 读取 cgroup v1/v2 限制；
- 未设置容器限制时才回退宿主机值；
- 磁盘展示应用数据卷或根文件系统，不展示无关系统挂载；
- `instance.id` 建议使用 Pod 名、容器 ID 短标识或部署实例 ID。

否则可能出现宿主机有 64GB 内存、容器实际限制只有 2GB，导致使用率严重失真。

### 7.7 多实例部署

负载均衡后，每次请求可能命中不同实例。必须选择一种语义：

1. 返回当前处理请求实例，并通过 `instance.id` 明确标识；
2. 从 Prometheus、Kubernetes Metrics 或其他监控系统聚合所有实例；
3. 返回实例数组，由前端选择实例。

当前前端按“当前实例”结构展示。多实例模式应设计新的 `instances[]` 响应，不能把不同实例的 CPU、内存和网络简单相加成一个百分比。

### 7.8 安全要求

禁止返回：

- 环境变量、API Key、Token 和数据库连接字符串；
- 进程命令行参数和完整进程列表；
- 内网 IP、网卡 MAC 和路由表；
- 用户目录、配置文件路径、文件列表和日志内容；
- 其他可能帮助攻击者识别基础设施的信息。

`hostname` 或 `instance.id` 如果包含敏感拓扑信息，应返回脱敏后的部署标识。接口必须执行 `system:monitor` 后端权限校验，并记录访问审计日志。

### 7.9 HTTP 首屏快照

`GET /api/dashboard/system` 只负责页面首屏和 WebSocket 尚未连接时的快照，不进行 HTTP 轮询。接口返回最近一次已完成采样，响应结构与 `system.status` WebSocket 消息的 `data` 完全一致。

- 后端采集任务每 3 秒执行一次；
- HTTP 请求只读取采样器快照，不能在每次请求中重新执行所有系统调用；
- 快照生成时间通过 `sampledAt` 明确返回；
- 单次采集应设置超时，避免磁盘或系统调用阻塞事件循环；
- 某个磁盘或网卡采集失败时可以省略该项并记录日志；
- 核心 CPU/内存采集失败且没有旧快照时返回 HTTP 503；
- 服务器状态失败不能影响业务统计和天气接口。

### 7.10 WebSocket 鉴权票据

浏览器原生 WebSocket 不能设置 `Authorization` 请求头，因此先通过已登录的 HTTP 请求换取一次性短期票据：

```http
POST /api/dashboard/system/socket-ticket
Authorization: Bearer <accessToken>
```

统一 JSON 响应的 `data`：

```json
{
  "ticket": "single-use-random-ticket",
  "expiresAt": "2026-07-18T08:00:30.000Z"
}
```

票据要求：

- 必须在签发时校验登录状态和 `system:monitor`；
- 使用至少 128 bit 密码学安全随机值，服务端只存哈希；
- 有效期建议 30 秒，只能消费一次；
- 绑定用户 ID、权限版本和预期 WebSocket 路径；
- 成功升级连接后立即作废；
- 不得把长期 access token 或 refresh token 放到 WebSocket URL；
- 日志、APM 和反向代理必须屏蔽 `ticket` 查询参数。

### 7.11 WebSocket 连接与消息

```text
ws://<host>/api/dashboard/system/stream?ticket=<single-use-ticket>
wss://<host>/api/dashboard/system/stream?ticket=<single-use-ticket>
```

生产环境必须使用 `wss://`。连接成功后，服务器在每次采样完成时推送：

```json
{
  "type": "system.status",
  "sequence": 1024,
  "data": {
    "status": "healthy",
    "sampledAt": "2026-07-18T08:00:03.000Z"
  }
}
```

上例省略了 `data` 的其他字段；实际 `data` 必须符合 7.1 的完整结构。`sequence` 在单个实例内单调递增，前端可以忽略乱序或重复消息。

应用层心跳消息：

```json
{ "type": "ping", "timestamp": 1784361600000 }
{ "type": "pong", "timestamp": 1784361600000 }
```

WebSocket 要求：

- 每 3 秒推送一次最新采样，不为每个连接重复采集；
- 所有连接共享同一个只读采样器快照；
- 服务端每 20–30 秒发送心跳，连续 2 个周期未收到 pong 时关闭连接；
- 客户端断开后使用 1、2、4、8、15 秒上限的指数退避重连，并重新申请票据；
- 服务端设置单用户连接数上限，建议最多 3 条；
- 慢客户端只保留最新状态，不能无限堆积发送队列；
- 权限被撤销或会话失效时主动关闭连接；
- 连接关闭码建议：`4401` 未认证、`4403` 无权限、`4429` 连接过多、`4503` 采集服务不可用；
- 部署在 Nginx、网关或负载均衡器后时需要启用 Upgrade/Connection 透传，并将空闲超时设置为大于两个心跳周期。

该接口是给管理员查看的详细监控，不能替代负载均衡器使用的轻量 `/health` 或 `/ready`。

## 8. 天气接口要求

天气依赖外部供应商，缓存周期和失败模式与数据库统计不同，因此使用独立接口，不建议放进 `/api/dashboard/overview`：

```http
GET /api/dashboard/weather
Authorization: Bearer <accessToken>
```

接口只要求登录，不需要新增天气权限。天气属于所有后台用户都可以看到的非敏感公共信息。

### 8.1 响应结构

```ts
interface DashboardWeather {
  location: {
    name: string
    region?: string | null
    country?: string | null
  }
  current: {
    conditionCode: number
    conditionText: string
    temperature: number
    feelsLike: number
    humidity: number
    windSpeed: number
    windDirection?: string | null
    observedAt: string
  }
  forecast?: {
    high: number
    low: number
  } | null
}
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "location": {
      "name": "上海",
      "region": "上海市",
      "country": "中国"
    },
    "current": {
      "conditionCode": 2,
      "conditionText": "多云",
      "temperature": 31.2,
      "feelsLike": 35.1,
      "humidity": 72,
      "windSpeed": 13.5,
      "windDirection": "东南风",
      "observedAt": "2026-07-18T08:00:00.000Z"
    },
    "forecast": {
      "high": 34,
      "low": 27
    }
  }
}
```

### 8.2 单位和编码

- `temperature`、`feelsLike`、`forecast.high`、`forecast.low` 使用摄氏度；
- `humidity` 使用 0–100 的百分数，不带 `%` 字符；
- `windSpeed` 统一使用 `km/h`；
- 时间统一使用 UTC ISO 8601；
- `conditionText` 返回适合直接展示的中文文本；
- `conditionCode` 推荐归一化为 WMO Weather Interpretation Code。

前端图标的基础映射：

| conditionCode | 天气类型           |
| ------------- | ------------------ |
| `0`           | 晴                 |
| `1–3`         | 晴间多云、多云、阴 |
| `45、48`      | 雾                 |
| `51–67`       | 毛毛雨或降雨       |
| `71–77`       | 降雪               |
| `80–86`       | 阵雨或阵雪         |
| `95–99`       | 雷暴               |

如果供应商使用自己的编码，后端适配层负责转换，前端不直接理解供应商私有 Code。

### 8.3 地点配置

推荐增加私有网站设置：

```json
{
  "key": "weather:location",
  "value": {
    "name": "上海",
    "latitude": 31.2304,
    "longitude": 121.4737
  },
  "isPublic": false,
  "description": "后台仪表盘天气位置"
}
```

要求：

- 纬度范围 `-90..90`；
- 经度范围 `-180..180`；
- 配置缺失时使用环境变量中的默认位置；
- 不建议由前端每次传入经纬度，避免隐私授权、缓存碎片和任意位置滥用；
- 如果未来支持用户自选城市，应单独设计偏好和缓存键。

### 8.4 第三方供应商

后端可以接入 Open-Meteo、和风天气或其他服务，但必须通过适配层转换为统一响应。

```ts
interface WeatherProvider {
  getCurrentWeather(location: WeatherLocation): Promise<DashboardWeather>
}
```

API Key 应保存在环境变量或安全密钥服务中：

```text
WEATHER_PROVIDER=open-meteo
WEATHER_API_KEY=<secret>
WEATHER_DEFAULT_LATITUDE=31.2304
WEATHER_DEFAULT_LONGITUDE=121.4737
WEATHER_DEFAULT_NAME=上海
```

禁止：

- 把第三方 API Key 返回给前端；
- 把 Key 放入 `isPublic: true` 的网站设置；
- 让浏览器直接请求需要密钥的第三方接口；
- 把客户端输入直接拼成任意外部 URL，避免 SSRF。

### 8.5 缓存和刷新

天气不需要每次打开 Home 都请求第三方服务。

建议：

- 服务端缓存 10–30 分钟；
- 缓存键包含供应商和经纬度；
- 第三方请求超时控制在 3–5 秒；
- 有旧缓存时，第三方暂时失败可以返回旧缓存并记录日志；
- 响应可以增加 `X-Weather-Cache: HIT|MISS|STALE` 便于诊断；
- 前端缓存 10 分钟，每 30 分钟后台刷新一次。

### 8.6 错误和降级

天气不可用不能影响 `/api/dashboard/overview`、公开网站设置或其他 Home 数据。

建议状态码：

| 状态码 | 场景                     |
| ------ | ------------------------ |
| 401    | 用户未登录               |
| 500    | 天气位置配置不合法       |
| 502    | 第三方返回无效响应       |
| 503    | 第三方超时且没有可用缓存 |

前端在天气接口失败时显示“天气暂不可用”，仪表盘其他区域继续正常展示。

## 9. 网站公开设置要求

Home 页继续通过以下公开接口读取网站信息：

```http
GET /api/settings/public
```

建议至少存在以下公开设置：

| key                  | value 类型 | 用途     |
| -------------------- | ---------- | -------- |
| `site:name`          | string     | 网站名称 |
| `site:description`   | string     | 网站描述 |
| `site:contact-email` | string     | 联系邮箱 |

三项设置必须保持 `isPublic: true` 才会在 Home 页面显示。缺失或类型不是字符串时，前端会使用默认值。

仪表盘聚合接口不应重复返回这些公开配置，避免形成两份配置来源。

## 10. 快捷操作的后端要求

快捷操作完全由 `/api/auth/me` 返回的权限列表决定，不需要新增接口。

请确保当前用户权限数据包含以下资源标识：

| 快捷操作 | 权限                  |
| -------- | --------------------- |
| 新增文章 | `article:create`      |
| 文章管理 | `article:list`        |
| 文章审批 | `article:review:list` |
| 用户管理 | `user:list`           |
| 角色权限 | `role:list`           |
| 网站设置 | `setting:list`        |

超级管理员通过 `isSuper: true` 显示全部入口。快捷入口显隐不替代目标页面和接口的后端权限校验。

## 11. 数据库查询建议

应使用数据库计数和聚合能力，不要为了统计把完整列表加载到 Node.js 内存。

伪代码示例：

```ts
const [articleTotal, approvalRows, publicationRows, recentArticles, recentTags, articleGrowth] =
  await Promise.all([
    articleRepository.count(),
    articleRepository.groupByApprovalStatus(),
    articleRepository.groupByPublicationStatus(),
    articleRepository.findRecent({ limit: 5 }),
    tagRepository.findRecent({ limit: 5 }),
    articleRepository.countCreatedByPeriods({ currentFrom, currentTo, previousFrom }),
  ])
```

其他模块使用 `COUNT` 或 MongoDB `countDocuments()`：

```ts
const settingsCount = await websiteSettingsCollection.countDocuments()
```

分类和权限资源如果使用邻接表或树结构存储，统计总量应直接对表执行 Count，不需要先构建整棵树。

所有互不依赖的统计查询可以使用 `Promise.all` 并发执行，但应根据用户权限只创建需要的查询，避免查询后再删除无权限字段。

## 12. 性能和缓存

### 12.1 查询性能

- `articles.approvalStatus` 建议建立索引；
- `articles.status` 建议建立索引；
- 最近文章查询建议为 `updatedAt` 建立索引；
- 需要返回最新数据的其他表也建议为 `updatedAt` 建立索引；
- 所有需要计算增长率的表建议为 `createdAt` 建立索引；
- 统计查询不要 Select 正文、封面等大字段；
- 聚合接口目标响应时间建议控制在 500ms 内。

如果文章表数据量较小，可以使用多条 Count 查询。如果数据量很大或仪表盘访问频繁，可考虑：

- 数据库分组聚合；
- 短时 Redis 缓存；
- 预计算统计表；
- 通过事件异步更新计数器。

### 12.2 HTTP 缓存

该接口响应与当前用户权限有关，不能使用公共 CDN 缓存。

可以设置：

```http
Cache-Control: private, max-age=30
```

如果服务端使用 Redis 或内存缓存，缓存键必须包含权限集合、角色版本或用户权限版本，防止不同权限用户共享同一份完整统计结果。

前端默认会缓存约 30 秒，短时间内重复进入 Home 页面通常不会重复请求。

## 13. 错误响应

沿用统一错误结构：

```json
{
  "code": 500,
  "message": "仪表盘统计失败",
  "data": null
}
```

建议状态码：

| 状态码 | 场景                         |
| ------ | ---------------------------- |
| 401    | 未登录、Token 无效或刷新失败 |
| 500    | 数据库或聚合查询失败         |
| 503    | 统计依赖服务暂不可用         |

权限不足不应导致整个仪表盘返回 403，应通过字段裁剪返回用户有权查看的部分数据。

不要返回部分字段后使用 HTTP 500；如果产品要求允许部分统计失败，需要增加明确的 `warnings` 结构，而不是静默把失败数量当作 0。

可选结构：

```json
{
  "generatedAt": "2026-07-18T08:00:00.000Z",
  "metrics": {
    "articles": 128
  },
  "warnings": [
    {
      "module": "users",
      "message": "用户统计暂不可用"
    }
  ]
}
```

## 14. 前后端迁移建议

### 阶段一：保持现状

后端无需立即增加接口，只需保证现有列表接口：

- 支持 `page=1&pageSize=1`；
- 返回准确的 `total`；
- 文章列表支持 `approvalStatus` 和 `status` 筛选；
- 文章、标签、用户和角色列表支持 `orderBy=updatedAt&order=desc`；
- 文章、标签、用户和角色列表支持 `createdFrom/createdTo` 半开区间筛选；
- 列表权限与现有资源标识一致。

### 阶段二：新增聚合接口

实现：

```http
GET /api/dashboard/overview
```

完成权限裁剪和自动化测试。

### 阶段三：前端切换

前端将多个列表统计请求替换为一次聚合请求。现有列表接口保持不变，其他页面继续使用。

切换期间可以保留旧查询作为开发环境回退，但生产环境不应同时请求聚合接口和全部旧统计接口。

## 15. 验收清单

### 功能

- 超级管理员返回全部模块统计；
- 普通用户只返回拥有列表权限的模块；
- 五种文章审批状态数量准确；
- 上架和下架数量准确；
- 每个有权限模块的最新数据最多 5 条，排序稳定；
- 各模块增长率使用相同的滚动 7 天口径；
- 最新用户和网站设置不包含敏感字段；
- 分类和权限资源统计包含全部树节点；
- 网站设置统计不包含任何设置值；
- 公开网站名称、描述和联系邮箱可以正常读取。
- 天气接口返回配置地点的中文天气、摄氏温度、湿度和 km/h 风速；
- 天气供应商不可用时不会影响仪表盘统计接口。
- 服务器接口正确返回 CPU、内存、磁盘、网络、Node.js 进程和实例信息；
- CPU、内存、磁盘使用率均为 `0..100` 的数值，容量为字节，网络速率为字节/秒；
- `cpu.perCore` 为每个可用逻辑核心返回独立使用率，不复制总体使用率；
- 每个实际业务磁盘或分区都返回设备、盘符/挂载点、文件系统、容量、使用率和 I/O；
- 每个有效网卡都返回状态、链路速度、实时收发速率和累计流量；
- 服务器历史采样按 `sampledAt` 升序返回，且最多 60 个点；
- 容器环境优先使用 cgroup 的 CPU、内存限制和文件系统视图，不误报宿主机总资源；
- 服务器状态采集失败不会影响天气、业务统计和公开网站设置接口。

### 权限

- 无 `user:list` 时响应中不存在用户数量；
- 无 `setting:list` 时响应中不存在网站设置数量；
- 无 `article:list` 时响应中不存在文章统计和 `recent.articles`；
- 无对应列表权限时，响应中不存在对应 `recent` 字段；
- 无对应列表权限时，响应中不存在对应 `growth` 字段；
- 仅有 `article:review:list` 不应自动获得全部文章统计；
- 超级管理员 `isSuper: true` 正常放行；
- 未登录请求返回 401；
- 登录用户可以访问天气接口，未登录用户不能访问；
- 仅拥有 `system:monitor` 的普通用户可以访问服务器状态接口；
- 无 `system:monitor` 时服务器状态接口返回 403，前端不发起该请求；
- 超级管理员无需显式分配 `system:monitor` 也可以访问服务器状态接口；
- 申请 WebSocket 票据和升级连接时都会校验 `system:monitor`；
- 票据过期、重复消费或权限撤销后不能建立连接；
- 响应不包含环境变量、Token、密钥、数据库连接串、进程启动参数、完整内网 IP 或网卡 MAC 地址。

### 一致性

- 审批状态数量之和等于文章总数；
- 发布状态数量之和等于文章总数；
- 聚合接口数量与对应列表接口 `total` 一致；
- 各模块最新数据字段和日期格式符合约定；
- 最新数据与对应列表按 `updatedAt DESC` 查询的前 5 条一致。
- 增长率与对应模块两个时间区间的列表 `total` 一致；
- 上一周期为零时不会返回无穷大或字符串百分比；
- `cpu.usage`、`memory.usage`、磁盘 `usage` 与对应容量数据的计算结果一致；
- 网络收发速率使用相邻采样累计字节差计算，计数器重置时不会返回负数；
- `history` 中时间、使用率和网络速率单位与当前快照字段一致；
- HTTP 快照与 WebSocket `system.status.data` 使用完全相同的结构；
- WebSocket `sequence` 单调递增，推送间隔约为 3 秒；

### 性能

- 不加载文章正文等大字段；
- 使用数据库 Count/Group 查询；
- 无权限模块不会执行数据库查询；
- 高数据量下响应时间符合目标；
- 缓存不会跨权限用户泄露统计结果；
- 天气缓存按供应商和位置隔离，不会在每次页面访问时调用第三方；
- 第三方天气请求设置了超时，并能使用过期缓存降级；
- 服务器每 3 秒采样并通过 WebSocket 推送，前端不进行 HTTP 轮询；
- 并发请求复用同一次服务器采样，采集过程不会阻塞事件循环或造成明显 CPU 抖动；
- 磁盘或网卡的单项采集失败可以降级，不会使其他服务器指标全部不可用；
- 多个 WebSocket 客户端共享采样结果，慢客户端不会造成无界消息堆积；
- 心跳、指数退避重连、单用户连接数限制和网关空闲超时配置通过测试。

## 16. 结论

前端仪表盘当前可以基于现有接口工作，因此聚合接口不是阻塞上线的强制变更。但新增 `GET /api/dashboard/overview` 可以显著减少 Home 页面请求数量，并把统计口径、权限控制和数据库聚合集中在后端，是推荐的生产实现。

后端实现时最重要的要求是：按现有列表权限裁剪字段、使用数据库聚合而不是加载完整列表、只返回仪表盘需要的数据，并确保私有网站设置和无权限模块的数量不会泄露。系统监控独立页面通过一次性票据建立 WebSocket，所有连接共享 3 秒采样快照；同时必须校验 `system:monitor`、按容器实际限制采样，并避免向浏览器暴露服务器密钥、网络拓扑和进程启动信息。

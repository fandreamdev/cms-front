# 文章状态流转后端变更要求

## 1. 状态定义

文章包含两个相互独立但存在约束的状态字段：

- `status`: `0` 已下架，`1` 已上架。
- `approvalStatus`: `draft` 草稿、`pending` 审批中、`approved` 审核通过、`rejected` 审核拒绝、`withdrawn` 已撤回。

后端是状态规则的最终执行方，不能只依赖前端隐藏按钮。

## 2. 操作规则

| 操作     | 允许条件                             | 状态变化                       |
| -------- | ------------------------------------ | ------------------------------ |
| 编辑     | 作者本人、已上架、非审批中           | 审批状态不变                   |
| 提交审批 | 作者本人、已上架、非审批中           | `approvalStatus -> pending`    |
| 撤回     | 作者本人、已上架、审批中             | `pending -> withdrawn`         |
| 审核通过 | 有审核权限、已上架、审批中           | `pending -> approved`          |
| 审核拒绝 | 有审核权限、已上架、审批中           | `pending -> rejected`          |
| 下架     | 有状态权限、已上架、非审批中         | `status: 1 -> 0`               |
| 上架     | 有状态权限、已下架                   | `status: 0 -> 1`，审批状态不变 |
| 删除     | 作者本人、已上架，且为草稿或审核拒绝 | 删除文章                       |

已下架文章只允许查看和上架。审批中的文章不能编辑、重复提交、删除或下架。

## 3. 接口校验

### 更新文章

```http
PUT /api/articles/:id
```

仅允许作者在 `status = 1` 且 `approvalStatus != pending` 时更新，否则返回 HTTP 409。

### 提交审批

```http
POST /api/articles/:id/submit
```

仅允许作者提交已上架且非审批中的文章。成功后将审批状态设为 `pending`，并更新 `submittedAt`；应清空旧的审核人、审核时间和拒绝原因。

### 撤回

```http
POST /api/articles/:id/withdraw
```

仅允许作者撤回已上架且处于 `pending` 的文章。成功后设为 `withdrawn`。

### 审核

```http
POST /api/articles/:id/approve
POST /api/articles/:id/reject
```

仅允许具有 `article:approve` 权限的用户处理已上架且处于 `pending` 的文章。拒绝接口必须校验非空拒绝原因。

### 上下架

```http
PUT /api/articles/:id/status
```

- `status: 0`：仅允许当前已上架且非审批中的文章下架。
- `status: 1`：仅允许当前已下架的文章上架。
- 审批中请求下架必须返回 HTTP 409。

## 4. 并发与错误响应

所有状态判断和更新必须在同一事务中完成，建议使用条件更新或乐观锁防止重复审批、审批与撤回同时发生。

| 场景                   | HTTP 状态 | 建议消息                                              |
| ---------------------- | --------- | ----------------------------------------------------- |
| 当前状态不允许操作     | 409       | `Current article state does not allow this operation` |
| 非文章作者执行作者操作 | 403       | `Only the author can perform this operation`          |
| 缺少资源权限           | 403       | `Forbidden`                                           |
| 文章不存在             | 404       | `Article not found`                                   |

状态变更接口成功后必须返回最新文章对象，包含 `status`、`approvalStatus`、`submittedAt`、`reviewedAt`、`reviewer` 和 `rejectionReason`。

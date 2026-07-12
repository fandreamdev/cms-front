# 动态菜单与按钮权限后端配合要求

## 权限数据

`GET /api/auth/me` 的 `permissions` 必须返回当前用户拥有的全部资源标识（资源表的 `url` 字段）。超级管理员通过 `isSuper: true` 放行，无需返回全部标识。

菜单资源使用前端路由：

- `/admin/reviews/articles`
- `/admin/system/users`
- `/admin/system/roles`
- `/admin/system/accesses`
- `/admin/content/articles`
- `/admin/content/categories`
- `/admin/content/tags`

按钮资源：

- 用户：`user:create`、`user:view`、`user:edit`、`user:delete`
- 角色：`role:create`、`role:view`、`role:edit`、`role:delete`
- 资源：`access:create`、`access:view`、`access:edit`、`access:delete`
- 文章：`article:create`、`article:view`、`article:edit`、`article:delete`、`article:submit`、`article:withdraw`、`article:approve`、`article:status`
- 分类：`category:create`、`category:view`、`category:edit`、`category:delete`
- 标签：`tag:create`、`tag:view`、`tag:edit`、`tag:delete`

按钮资源应使用 `feature` 类型，并挂到对应的 `menu` 资源下。请通过数据库迁移或种子数据幂等创建以上资源，避免重复插入。

## 接口鉴权

前端的菜单和按钮显隐不等同于安全鉴权。后端必须在对应接口校验相同的按钮资源；无权限统一返回 HTTP 403。角色资源发生变化后，下一次 `GET /api/auth/me` 应返回最新权限。

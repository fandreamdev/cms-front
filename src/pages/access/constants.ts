import type { AccessType } from '../../api/access'

export const ROOT_PARENT_VALUE = 0

export const typeOptions: { label: string; value: AccessType }[] = [
  { label: '模块', value: 'module' },
  { label: '菜单', value: 'menu' },
  { label: '功能', value: 'feature' },
]

export const typeLabelMap: Record<AccessType, string> = {
  module: '模块',
  menu: '菜单',
  feature: '功能',
}

export const typeColorMap: Record<AccessType, string> = {
  module: 'blue',
  menu: 'green',
  feature: 'gold',
}

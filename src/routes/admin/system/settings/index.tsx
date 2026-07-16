import { createFileRoute } from '@tanstack/react-router'
import SettingListPage from '../../../../pages/setting/SettingList'

export const Route = createFileRoute('/admin/system/settings/')({ component: SettingListPage })

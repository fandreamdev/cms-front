import { useQuery } from '@tanstack/react-query'
import { getPublicWebsiteSettings } from '../../api/setting'
import { queryKeys } from '../../app/queryKeys'
import { getPublicStringSetting, WEBSITE_SETTING_KEYS } from '../../config/websiteSettings'

interface AppLogoProps {
  collapsed: boolean
}

const AppLogo = ({ collapsed }: AppLogoProps) => {
  const { data: settings } = useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: getPublicWebsiteSettings,
  })
  const websiteName = getPublicStringSetting(settings, WEBSITE_SETTING_KEYS.name, 'CMS')

  return (
    <div
      title={websiteName}
      style={{
        flexShrink: 0,
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#001529',
        color: '#fff',
        fontSize: collapsed ? 14 : 18,
        fontWeight: 600,
        letterSpacing: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        padding: '0 12px',
        transition: 'width 0.2s',
      }}
    >
      {websiteName}
    </div>
  )
}

export default AppLogo

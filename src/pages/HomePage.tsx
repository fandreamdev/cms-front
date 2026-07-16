import { useQuery } from '@tanstack/react-query'
import { MailOutlined } from '@ant-design/icons'
import { Card, Skeleton, Space, Typography } from 'antd'
import { getPublicWebsiteSettings } from '../api/setting'
import { queryKeys } from '../app/queryKeys'
import { getPublicStringSetting, WEBSITE_SETTING_KEYS } from '../config/websiteSettings'

const HomePage = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings.public,
    queryFn: getPublicWebsiteSettings,
  })
  const name = getPublicStringSetting(settings, WEBSITE_SETTING_KEYS.name, 'CMS')
  const description = getPublicStringSetting(
    settings,
    WEBSITE_SETTING_KEYS.description,
    '内容管理系统',
  )
  const contactEmail = getPublicStringSetting(
    settings,
    WEBSITE_SETTING_KEYS.contactEmail,
    'contact@example.com',
  )

  return (
    <Card style={{ minHeight: '100%' }}>
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Space direction="vertical" size="large" style={{ width: '100%', padding: '48px 24px' }}>
          <Typography.Title style={{ margin: 0 }}>{name}</Typography.Title>
          <Typography.Paragraph type="secondary" style={{ fontSize: 18, maxWidth: 720 }}>
            {description}
          </Typography.Paragraph>
          <Typography.Link href={`mailto:${contactEmail}`}>
            <MailOutlined /> {contactEmail}
          </Typography.Link>
        </Space>
      )}
    </Card>
  )
}

export default HomePage

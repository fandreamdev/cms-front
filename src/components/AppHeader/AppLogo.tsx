interface AppLogoProps {
  collapsed: boolean
}

const AppLogo = ({ collapsed }: AppLogoProps) => {
  return (
    <div
      style={{
        width: collapsed ? 80 : 220,
        flexShrink: 0,
        height: '100%',
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
        transition: 'width 0.2s',
      }}
    >
      {collapsed ? 'CMS' : 'CMS管理后台'}
    </div>
  )
}

export default AppLogo

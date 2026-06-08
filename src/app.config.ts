export default defineAppConfig({
  pages: [
    'pages/voyage/index',
    'pages/ship/index',
    'pages/loading/index',
    'pages/exception/index',
    'pages/message/index',
    'pages/voyage-detail/index',
    'pages/exception-detail/index',
    'pages/fleet-overview/index',
    'pages/export/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0066CC',
    navigationBarTitleText: '水路运输管理',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F0F7FF'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#0066CC',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/voyage/index',
        text: '航次列表'
      },
      {
        pagePath: 'pages/ship/index',
        text: '船舶动态'
      },
      {
        pagePath: 'pages/loading/index',
        text: '装卸确认'
      },
      {
        pagePath: 'pages/exception/index',
        text: '异常上报'
      },
      {
        pagePath: 'pages/message/index',
        text: '消息中心'
      }
    ]
  }
})

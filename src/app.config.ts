export default defineAppConfig({
  pages: [
    'pages/devices/index',
    'pages/calculator/index',
    'pages/energy/index',
    'pages/candidates/index',
    'pages/reminders/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#22c55e',
    navigationBarTitleText: '家电换新决策',
    navigationBarTextStyle: 'white'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#22c55e',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/devices/index',
        text: '设备清单'
      },
      {
        pagePath: 'pages/calculator/index',
        text: '费用测算'
      },
      {
        pagePath: 'pages/energy/index',
        text: '能耗对比'
      },
      {
        pagePath: 'pages/candidates/index',
        text: '换新候选'
      },
      {
        pagePath: 'pages/reminders/index',
        text: '提醒'
      }
    ]
  }
})

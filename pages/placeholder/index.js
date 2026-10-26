const homeGroups = require('../../config/homeGroups')

const allFeatures = homeGroups.reduce((result, group) => result.concat(group.features), [])

Page({
  onBack() { wx.reLaunch({ url: '/pages/home/index' }) },
  data: { title: '功能开发中', description: '更多实用工具即将开放，敬请期待。' },
  onLoad(options) {
    const feature = allFeatures.find(item => item.id === options.id)
    if (feature) this.setData({ title: feature.title, description: feature.description || '该功能正在准备中，敬请期待。' })
    wx.setNavigationBarTitle({ title: feature ? feature.title : '功能介绍' })
  }
})

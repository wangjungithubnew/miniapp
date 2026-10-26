const homeGroups = require('../../config/homeGroups')
const unlockPolicy = require('../../services/unlockPolicy')

Page({
  data: { groups: homeGroups },
  onFeatureSelect(e) {
    const feature = e.detail.feature
    if (!feature) return
    if (unlockPolicy.isFeatureLocked(feature.id)) {
      wx.showToast({ title: '该功能暂不可用', icon: 'none' })
      return
    }
    if (feature.external) {
      wx.showToast({ title: '即将开放', icon: 'none' })
      return
    }
    if (feature.route) {
      wx.navigateTo({ url: feature.route })
      return
    }
    wx.navigateTo({ url: `/pages/placeholder/index?id=${encodeURIComponent(feature.id)}` })
  },
  contactService() {
    wx.showToast({ title: '请通过小程序会话联系客服', icon: 'none' })
  },
  shareAppMessage() {
    return { title: '电子签名 · 书法工具', path: '/pages/home/index' }
  },
  onShareAppMessage() {
    return this.shareAppMessage()
  }
})

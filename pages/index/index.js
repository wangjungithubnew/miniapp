Page({
  onShow() {
    wx.switchTab ? wx.reLaunch({ url: '/pages/home/index' }) : wx.navigateTo({ url: '/pages/home/index' })
  }
})

Page({
  openPage(e) { wx.navigateTo({ url: e.currentTarget.dataset.url }) },
  clearCache() {
    wx.showModal({ title: '清理缓存', content: '将清理小程序码等可重新生成的缓存；已保存的签名、作品和消息会保留。', success: res => {
      if (!res.confirm) return
      const codePath = wx.getStorageSync('miniCodeCache')
      if (codePath) wx.removeSavedFile({ filePath: codePath, fail: () => {} })
      wx.removeStorageSync('miniCodeCache')
      wx.showToast({ title: '缓存已清理', icon: 'success' })
    } })
  }
})

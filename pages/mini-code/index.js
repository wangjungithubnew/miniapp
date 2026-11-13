Page({
  data: { codePath: '', loading: true },
  onLoad() { this.loadCode() },
  async loadCode() {
    this.setData({ loading: true })
    try {
      const cached = wx.getStorageSync('miniCodeCache')
      if (cached) {
        const info = await new Promise((resolve, reject) => wx.getFileInfo({ filePath: cached, success: resolve, fail: reject })).catch(() => null)
        if (info) { this.setData({ codePath: cached, loading: false }); return }
      }
      const response = await wx.cloud.callFunction({ name: 'miniCode' })
      const fileID = response.result && response.result.fileID
      if (!fileID) throw new Error('未取得小程序码')
      const download = await wx.cloud.downloadFile({ fileID })
      if (!download.tempFilePath) throw new Error('下载小程序码失败')
      const saved = await new Promise((resolve, reject) => wx.saveFile({ tempFilePath: download.tempFilePath, success: resolve, fail: reject }))
      wx.setStorageSync('miniCodeCache', saved.savedFilePath)
      this.setData({ codePath: saved.savedFilePath, loading: false })
    } catch (error) {
      console.error('miniCode failed', error)
      this.setData({ loading: false })
      wx.showModal({ title: '小程序码暂不可用', content: '请先部署 miniCode 云函数，并确认小程序已发布。', showCancel: false })
    }
  },
  saveToAlbum() {
    if (!this.data.codePath) return
    wx.saveImageToPhotosAlbum({ filePath: this.data.codePath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '保存失败，请检查相册权限', icon: 'none' }) })
  }
})

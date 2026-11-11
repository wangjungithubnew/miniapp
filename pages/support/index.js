Page({
  data: { amounts: [1, 5, 10, 20], selected: 5, paymentReady: false },
  chooseAmount(e) { this.setData({ selected: Number(e.currentTarget.dataset.amount) }) },
  pay() {
    if (!this.data.paymentReady) {
      wx.showModal({ title: '支付功能开通中', content: '当前小程序还没有配置微信支付商户号。完成商户号和后端支付服务配置后，即可使用赞赏支付。', showCancel: false, confirmText: '知道了' })
      return
    }
    wx.showToast({ title: '支付服务暂未连接', icon: 'none' })
  },
  onShareAppMessage() { return { title: '支持作者维护签名工具', path: '/pages/support/index' } }
})

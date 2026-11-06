Page({
  data: { text: '', color: '#D95778', size: 64, styleIndex: 0, styles: ['优雅', '简约', '艺术'], colors: ['#D95778', '#16835E', '#4C68D7', '#17202C'], savedPath: '' },
  onLoad() { this.canvas = null; this.ctx = null },
  onReady() { wx.createSelectorQuery().select('#designCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.draw() }) },
  onInput(e) { this.setData({ text: e.detail.value }, () => this.draw()) },
  chooseStyle(e) { this.setData({ styleIndex: Number(e.currentTarget.dataset.index) }, () => this.draw()) },
  chooseColor(e) { this.setData({ color: e.currentTarget.dataset.color }, () => this.draw()) },
  changeSize(e) { this.setData({ size: Number(e.detail.value) }, () => this.draw()) },
  draw() {
    if (!this.ctx) return
    const ctx = this.ctx; const w = this.canvas.width / 2; const h = this.canvas.height / 2
    ctx.clearRect(0, 0, w, h); if (!this.data.text) return
    const fonts = ['cursive', 'sans-serif', 'serif']; const font = fonts[this.data.styleIndex]
    ctx.fillStyle = this.data.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${this.data.styleIndex === 2 ? 'italic ' : ''}${this.data.size}px ${font}`
    ctx.fillText(this.data.text, w / 2, h / 2)
    ctx.strokeStyle = this.data.color; ctx.globalAlpha = .35; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(w * .2, h * .68); ctx.quadraticCurveTo(w * .5, h * .78, w * .82, h * .68); ctx.stroke(); ctx.globalAlpha = 1
  },
  save() {
    if (!this.data.text.trim()) return wx.showToast({ title: '请输入签名内容', icon: 'none' })
    wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '签名已保存', icon: 'success' }) } }) })
  },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存签名', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) }
})

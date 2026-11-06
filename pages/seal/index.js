Page({
  data: { text: '', subText: '', color: '#C83B4B', shape: 'circle', size: 260, savedPath: '' },
  onReady() { wx.createSelectorQuery().select('#sealCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.draw() }) },
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }, () => this.draw()) },
  chooseShape(e) { this.setData({ shape: e.currentTarget.dataset.shape }, () => this.draw()) },
  chooseColor(e) { this.setData({ color: e.currentTarget.dataset.color }, () => this.draw()) },
  changeSize(e) { this.setData({ size: Number(e.detail.value) }, () => this.draw()) },
  draw() {
    if (!this.ctx) return
    const ctx = this.ctx; const w = this.canvas.width / 2; const h = this.canvas.height / 2; const s = Math.min(this.data.size, Math.min(w, h) - 30); const cx = w / 2; const cy = h / 2
    ctx.clearRect(0, 0, w, h); ctx.strokeStyle = this.data.color; ctx.fillStyle = this.data.color; ctx.lineWidth = 5
    ctx.save(); ctx.translate(cx, cy)
    if (this.data.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s / 2 - 10, 0, Math.PI * 2); ctx.stroke() } else { ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.lineWidth = 2; ctx.strokeRect(-s / 2 + 10, -s / 2 + 10, s - 20, s - 20) }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${Math.max(22, s * .18)}px sans-serif`; ctx.fillText(this.data.text || '印章文字', 0, this.data.shape === 'circle' ? 8 : 0)
    if (this.data.subText) { ctx.font = `${Math.max(12, s * .09)}px sans-serif`; ctx.fillText(this.data.subText, 0, s * .29) }
    ctx.restore()
  },
  save() { if (!this.data.text.trim()) return wx.showToast({ title: '请输入印章文字', icon: 'none' }); wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '印章已保存', icon: 'success' }) } }) }) },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存印章', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) }
})

Page({
  data: { text: '书法之美', styleIndex: 0, styles: ['楷书', '行书', '隶书'], size: 72, color: '#17202C', grid: true, savedPath: '' },
  onReady() { wx.createSelectorQuery().select('#calligraphyCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.draw() }) },
  onInput(e) { this.setData({ text: e.detail.value }, () => this.draw()) },
  chooseStyle(e) { this.setData({ styleIndex: Number(e.currentTarget.dataset.index) }, () => this.draw()) },
  changeSize(e) { this.setData({ size: Number(e.detail.value) }, () => this.draw()) },
  toggleGrid() { this.setData({ grid: !this.data.grid }, () => this.draw()) },
  draw() {
    if (!this.ctx) return
    const ctx = this.ctx; const w = this.canvas.width / 2; const h = this.canvas.height / 2
    ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, w, h)
    if (this.data.grid) { ctx.strokeStyle = 'rgba(190,95,75,.25)'; ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke(); ctx.setLineDash([]) }
    const fonts = ['serif', 'cursive', 'serif']; ctx.fillStyle = this.data.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${this.data.styleIndex === 1 ? 'italic ' : ''}${this.data.size}px ${fonts[this.data.styleIndex]}`
    const chars = Array.from(this.data.text || ''); const gap = Math.min(this.data.size * 1.2, w / Math.max(chars.length, 1)); const start = w / 2 - (chars.length - 1) * gap / 2
    chars.forEach((char, i) => ctx.fillText(char, start + i * gap, h / 2))
  },
  save() { if (!this.data.text.trim()) return wx.showToast({ title: '请输入练习内容', icon: 'none' }); wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '作品已保存', icon: 'success' }) } }) }) },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存作品', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) }
})

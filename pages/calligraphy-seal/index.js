Page({
  data: { text: '静心', shape: 'square', mode: 'red', savedPath: '' },
  onReady() { wx.createSelectorQuery().select('#sealCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.draw() }) },
  onInput(e) { this.setData({ text: e.detail.value }, () => this.draw()) },
  choose(e) { this.setData({ [e.currentTarget.dataset.key]: e.currentTarget.dataset.value }, () => this.draw()) },
  draw() {
    if (!this.ctx) return
    const ctx = this.ctx; const w = this.canvas.width / 2; const h = this.canvas.height / 2; const s = Math.min(w, h) - 80; const color = '#b63b45'; ctx.clearRect(0, 0, w, h); ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, w, h); ctx.save(); ctx.translate(w / 2, h / 2); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 7
    if (this.data.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s / 2 - 13, 0, Math.PI * 2); ctx.stroke() } else { ctx.strokeRect(-s / 2, -s / 2, s, s); ctx.lineWidth = 2; ctx.strokeRect(-s / 2 + 13, -s / 2 + 13, s - 26, s - 26) }
    const chars = Array.from(this.data.text || '书法'); const vertical = chars.slice(0, 4); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${Math.min(70, s / 3.6)}px serif`; const gap = s / 3.2; vertical.forEach((char, i) => ctx.fillText(char, (i % 2 === 0 ? -gap / 2 : gap / 2), (i < 2 ? -gap / 2 : gap / 2)))
    if (this.data.mode === 'white') { ctx.globalCompositeOperation = 'destination-out'; ctx.font = `bold ${Math.min(70, s / 3.6)}px serif`; vertical.forEach((char, i) => ctx.fillText(char, (i % 2 === 0 ? -gap / 2 : gap / 2), (i < 2 ? -gap / 2 : gap / 2))); ctx.globalCompositeOperation = 'source-over' }
    ctx.restore()
  },
  save() { if (!this.data.text.trim()) return wx.showToast({ title: '请输入印章文字', icon: 'none' }); wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '书法印章已保存', icon: 'success' }) } }) }) },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存印章', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) }
})

Page({
  data: { text: '愿你心之所向，皆有回响', color: '#263448', size: 40, spacing: 8, natural: 5, savedPath: '' },
  onReady() { wx.createSelectorQuery().select('#handwritingCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.w = item.width; this.h = item.height; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.draw() }) },
  onInput(e) { this.setData({ text: e.detail.value }, () => this.draw()) },
  chooseColor(e) { this.setData({ color: e.currentTarget.dataset.color }, () => this.draw()) },
  change(e) { this.setData({ [e.currentTarget.dataset.field]: Number(e.detail.value) }, () => this.draw()) },
  draw() {
    if (!this.ctx) return
    const ctx = this.ctx; ctx.fillStyle = '#fffaf0'; ctx.fillRect(0, 0, this.w, this.h); ctx.fillStyle = this.data.color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; const chars = Array.from(this.data.text || ''); const lineWidth = this.w - 70; let x = 35; let y = 72; let line = 0
    chars.forEach((char, index) => { const jitter = this.data.natural; const rotate = (Math.random() - .5) * jitter * .025; const size = this.data.size + (Math.random() - .5) * jitter * 1.5; if (x + size > lineWidth) { x = 35; y += this.data.size + 28; line++ } ctx.save(); ctx.translate(x + size / 2, y); ctx.rotate(rotate); ctx.font = `${size}px cursive`; ctx.fillText(char, -size / 2, 0); ctx.restore(); x += size + this.data.spacing })
  },
  save() { if (!this.data.text.trim()) return wx.showToast({ title: '请输入文字', icon: 'none' }); wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '手写效果已保存', icon: 'success' }) } }) }) },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存效果图', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) }
})

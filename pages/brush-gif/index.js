Page({
  data: { color: '#D95778', width: 8, playing: false, savedPath: '', hasDrawing: false },
  onReady() { wx.createSelectorQuery().select('#brushCanvas').fields({ node: true, size: true }).exec(res => { const item = res && res[0]; if (!item || !item.node) return; this.canvas = item.node; this.w = item.width; this.h = item.height; this.canvas.width = item.width * 2; this.canvas.height = item.height * 2; this.ctx = this.canvas.getContext('2d'); this.ctx.scale(2, 2); this.reset() }) },
  point(e) { const t = e.touches && e.touches[0]; return t ? { x: t.x || t.clientX, y: t.y || t.clientY } : null },
  onTouchStart(e) { if (this.data.playing) return; const p = this.point(e); if (!p) return; this.current = [p]; this.strokes.push(this.current); this.setData({ hasDrawing: true }); this.draw() },
  onTouchMove(e) { if (!this.current || this.data.playing) return; const p = this.point(e); if (!p) return; this.current.push(p); this.draw() },
  onTouchEnd() { this.current = null },
  reset() { this.strokes = []; this.current = null; this.clearCanvas(); this.setData({ playing: false, savedPath: '', hasDrawing: false }) },
  clearCanvas() { if (!this.ctx) return; this.ctx.fillStyle = '#fff'; this.ctx.fillRect(0, 0, this.w, this.h) },
  draw(visible) { if (!this.ctx) return; this.clearCanvas(); const strokes = visible || this.strokes; this.ctx.strokeStyle = this.data.color; this.ctx.lineWidth = this.data.width; this.ctx.lineCap = 'round'; this.ctx.lineJoin = 'round'; strokes.forEach(points => { if (!points.length) return; this.ctx.beginPath(); this.ctx.moveTo(points[0].x, points[0].y); points.slice(1).forEach(p => this.ctx.lineTo(p.x, p.y)); this.ctx.stroke() }) },
  chooseColor(e) { this.setData({ color: e.currentTarget.dataset.color }, () => this.draw()) },
  changeWidth(e) { this.setData({ width: Number(e.detail.value) }, () => this.draw()) },
  togglePlay() { if (!this.strokes.length) return wx.showToast({ title: '请先绘制笔画', icon: 'none' }); if (this.data.playing) { this.stopPlay(); return } this.setData({ playing: true }); this.playStroke = 0; this.playPoint = 0; this.playNext() },
  playNext() { if (!this.data.playing) return; if (this.playStroke >= this.strokes.length) { this.setData({ playing: false }); return } const visible = this.strokes.slice(0, this.playStroke); const active = this.strokes[this.playStroke].slice(0, this.playPoint + 1); this.draw(visible.concat([active])); this.playPoint++; if (this.playPoint >= this.strokes[this.playStroke].length) { this.playStroke++; this.playPoint = 0 } this.timer = setTimeout(() => this.playNext(), 35) },
  stopPlay() { if (this.timer) clearTimeout(this.timer); this.setData({ playing: false }); this.draw() },
  save() { if (!this.strokes.length) return wx.showToast({ title: '请先绘制笔画', icon: 'none' }); this.stopPlay(); wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => wx.saveFile({ tempFilePath: res.tempFilePath, success: saved => { this.setData({ savedPath: saved.savedFilePath || res.tempFilePath }); wx.showToast({ title: '作品帧已保存', icon: 'success' }) } }) }) },
  saveAlbum() { if (!this.data.savedPath) return wx.showToast({ title: '请先保存作品', icon: 'none' }); wx.saveImageToPhotosAlbum({ filePath: this.data.savedPath, success: () => wx.showToast({ title: '已保存到相册', icon: 'success' }), fail: () => wx.showToast({ title: '请授权保存到相册', icon: 'none' }) }) },
  onUnload() { this.stopPlay() }
})

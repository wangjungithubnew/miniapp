const tools = require('../../config/signatureTools')
const shareItems = require('../../config/signatureShareMenu')
const unlockPolicy = require('../../services/unlockPolicy')
const signatureService = require('../../services/signatureService')
const DEFAULTS = { gridType: 'small', backgroundColor: '#fff7e8', color: '#17202c', lineWidth: 5, pressure: true }

function getDpr() {
  try { const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync(); return info.pixelRatio || 2 } catch (e) { return 2 }
}

Page({
  data: { tools, shareItems, isEmpty: true, canUndo: false, canRedo: false, previewing: false, shareVisible: false, settings: DEFAULTS, boardStyle: '' },
  onLoad() {
    this.strokes = []
    this.redoStack = []
    this.currentStroke = null
    this.canvas = null
    this.ctx = null
    this.dpr = 2
    this.cssW = 0
    this.cssH = 0
    this.saving = false
    this.using = false
    this.settings = Object.assign({}, DEFAULTS, wx.getStorageSync('signatureSettings') || {})
    this.setData({ settings: this.settings, boardStyle: `background-color:${this.settings.backgroundColor}` })
  },
  onReady() { this.initCanvas() },
  onShow() {
    const updated = Object.assign({}, DEFAULTS, wx.getStorageSync('signatureSettings') || {})
    this.settings = updated
    if (this.setData) this.setData({ settings: updated, boardStyle: `background-color:${updated.backgroundColor}` }, () => this.redraw())
  },
  initCanvas(retry) {
    wx.createSelectorQuery().select('#signCanvas').fields({ node: true, size: true }).exec(res => {
      const item = res && res[0]
      if (!item || !item.node || !item.width) {
        if ((retry || 0) < 12) setTimeout(() => this.initCanvas((retry || 0) + 1), 100)
        return
      }
      this.canvas = item.node
      this.dpr = getDpr()
      this.cssW = item.width
      this.cssH = item.height
      this.canvas.width = Math.round(item.width * this.dpr)
      this.canvas.height = Math.round(item.height * this.dpr)
      this.ctx = this.canvas.getContext('2d')
      this.ctx.scale(this.dpr, this.dpr)
      this.redraw()
    })
  },
  point(e) {
    const t = e.touches && e.touches[0]
    if (!t) return null
    let x = typeof t.x === 'number' ? t.x : t.clientX
    let y = typeof t.y === 'number' ? t.y : t.clientY
    if (x < 0 || y < 0 || x > this.cssW || y > this.cssH) return null
    return { x, y, time: Date.now() }
  },
  onTouchStart(e) {
    if (!this.ctx || this.data.previewing) return
    const point = this.point(e)
    if (!point) return
    this.currentStroke = { color: this.settings.color, width: this.settings.lineWidth, points: [point] }
    this.strokes.push(this.currentStroke)
    this.redoStack = []
    this.drawStroke(this.currentStroke)
    this.updateHistory()
  },
  onTouchMove(e) {
    if (!this.currentStroke || !this.ctx) return
    const point = this.point(e)
    if (!point) return
    const pts = this.currentStroke.points
    const last = pts[pts.length - 1]
    const dx = point.x - last.x, dy = point.y - last.y
    if (dx * dx + dy * dy < 0.5) return
    pts.push(point)
    this.drawStroke(this.currentStroke, true)
  },
  onTouchEnd() { this.currentStroke = null },
  drawStroke(stroke, incremental) {
    const ctx = this.ctx, pts = stroke.points
    if (!ctx || !pts.length) return
    ctx.save()
    ctx.globalCompositeOperation = 'source-over'
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (pts.length === 1) {
      ctx.beginPath(); ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2); ctx.fill()
    } else {
      // 平滑二次曲线 + 按点间速度调整线宽，模拟轻量笔锋。
      const start = incremental ? Math.max(0, pts.length - 3) : 0
      for (let i = Math.max(1, start); i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i]
        const distance = Math.hypot(b.x - a.x, b.y - a.y)
        const elapsed = Math.max(1, b.time - a.time)
        const speed = distance / elapsed
        const factor = this.settings.pressure ? Math.max(.48, Math.min(1.2, 1.05 - speed * .045)) : 1
        ctx.lineWidth = stroke.width * factor
        ctx.beginPath(); ctx.moveTo(a.x, a.y)
        if (i < pts.length - 1) {
          const c = pts[i + 1]
          ctx.quadraticCurveTo(b.x, b.y, (b.x + c.x) / 2, (b.y + c.y) / 2)
        } else ctx.lineTo(b.x, b.y)
        ctx.stroke()
      }
    }
    ctx.restore()
  },
  redraw() {
    if (!this.ctx) return
    this.ctx.clearRect(0, 0, this.cssW, this.cssH)
    this.strokes.forEach(stroke => this.drawStroke(stroke))
    this.updateHistory()
  },
  updateHistory() {
    const isEmpty = !this.strokes.length
    this.setData({ isEmpty, canUndo: !isEmpty, canRedo: this.redoStack.length > 0 })
  },
  undo() {
    if (!this.strokes.length) return
    this.redoStack.push(this.strokes.pop())
    this.redraw()
  },
  redo() {
    if (!this.redoStack.length) return
    this.strokes.push(this.redoStack.pop())
    this.redraw()
  },
  clear() {
    if (!this.strokes.length) return wx.showToast({ title: '画布已经是空白', icon: 'none' })
    wx.showModal({ title: '清除签名', content: '确定清除画布上的全部签名内容吗？', confirmText: '全部清除', confirmColor: '#e5484d', success: res => {
      if (!res.confirm) return
      this.strokes = []
      this.redoStack = []
      this.redraw()
    } })
  },
  async onToolTap(e) {
    const action = e.currentTarget.dataset.action
    if (action === 'erase') return this.clear()
    if (action === 'undo') return this.undo()
    if (action === 'redo') return this.redo()
    if (action === 'preview') return this.openPreview()
    if (action === 'settings') return wx.navigateTo({ url: '/pages/signature/settings' })
    if (action === 'share') return this.openSharePanel()
    if (action === 'save') return this.saveImage()
    if (action === 'use') return this.useSignature()
  },
  onToolLongPress(e) {
    if (e.currentTarget.dataset.action !== 'undo') return
    this.redo()
  },
  async allowed(action) {
    try { return await unlockPolicy.check(action) } catch (e) { return false }
  },
  async saveImage() {
    if (!await this.allowed('save')) return
    const path = await this.exportPng()
    if (!path) return
    try {
      await signatureService.saveToAlbum(path)
      wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      const msg = (err && err.errMsg) || ''
      if (msg.includes('auth') || msg.includes('deny')) {
        wx.showModal({ title: '需要相册权限', content: '请在设置中开启保存到相册权限后再试', confirmText: '去设置', success: r => { if (r.confirm) wx.openSetting() } })
      } else wx.showToast({ title: '保存失败', icon: 'none' })
    }
  },
  openSharePanel() { this.setData({ shareVisible: true }) },
  closeSharePanel() { this.setData({ shareVisible: false }) },
  noop() {},
  async onShareAction(e) {
    const action = e.currentTarget.dataset.action
    if (action === 'friend') {
      this.closeSharePanel()
      wx.showToast({ title: '请使用右上角菜单发送给朋友', icon: 'none' })
    } else if (action === 'timeline') {
      this.closeSharePanel()
      wx.showToast({ title: '请使用右上角菜单分享到朋友圈', icon: 'none' })
    } else if (action === 'favorite') {
      this.closeSharePanel()
      wx.showToast({ title: '请先保存图片，再在相册中收藏', icon: 'none' })
    } else if (action === 'save') {
      this.closeSharePanel()
      await this.saveImage()
    } else if (action === 'sticker') {
      this.closeSharePanel()
      if (!await this.allowed('use')) return
      const path = await this.exportPng()
      if (path) wx.showToast({ title: '签名贴图已生成，可在相册中转发', icon: 'none' })
    }
  },
  async useSignature() {
    if (!await this.allowed('use')) return
    if (this.using) return
    this.using = true
    const tempFilePath = await this.exportPng()
    this.using = false
    if (!tempFilePath) return
    const pages = getCurrentPages()
    const current = pages[pages.length - 1]
    const channel = current && current.getOpenerEventChannel && current.getOpenerEventChannel()
    if (channel && channel.emit) channel.emit('signatureCreated', { tempFilePath })
    wx.setStorageSync('lastSignaturePath', tempFilePath)
    if (pages.length > 1) wx.navigateBack()
    else wx.showToast({ title: '签名已生成', icon: 'success' })
  },
  exportPng() {
    if (!this.strokes.length) { wx.showToast({ title: '请先书写签名', icon: 'none' }); return Promise.resolve('') }
    if (this.saving) return Promise.resolve('')
    this.saving = true
    wx.showLoading({ title: '正在生成', mask: true })
    return new Promise(resolve => {
      wx.canvasToTempFilePath({ canvas: this.canvas, x: 0, y: 0, width: this.canvas.width, height: this.canvas.height, destWidth: this.canvas.width, destHeight: this.canvas.height, fileType: 'png', success: res => resolve(res.tempFilePath), fail: () => { wx.showToast({ title: '生成图片失败', icon: 'none' }); resolve('') }, complete: () => { this.saving = false; wx.hideLoading() } })
    })
  },
  openPreview() {
    this.setData({ previewing: true }, () => {
      wx.nextTick(() => {
        wx.createSelectorQuery().select('#signCanvas').fields({ node: true, size: true }).exec(res => this.resizeCanvas(res && res[0]))
      })
    })
  },
  closePreview() { this.setData({ previewing: false }) },
  resizeCanvas(item) {
    if (!item || !item.node || !item.width) return
    const same = item.node === this.canvas
    this.canvas = item.node
    this.cssW = item.width
    this.cssH = item.height
    this.canvas.width = Math.round(item.width * this.dpr)
    this.canvas.height = Math.round(item.height * this.dpr)
    this.ctx = this.canvas.getContext('2d')
    this.ctx.scale(this.dpr, this.dpr)
    if (same) this.redraw()
    else this.redraw()
  },
  goBack() { const pages = getCurrentPages(); if (pages.length > 1) wx.navigateBack(); else wx.reLaunch({ url: '/pages/home/index' }) },
  onShareAppMessage() { return { title: '我的手写签名', path: '/pages/signature/index' } }
})

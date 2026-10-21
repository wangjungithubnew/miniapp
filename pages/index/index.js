const db = wx.cloud.database()
const PRESET_COLORS = [
  '#000000', '#434343', '#7f7f7f', '#1e5eff',
  '#07c160', '#ff4d4f', '#fa8c16', '#8b5cf6'
]

function getDpr() {
  try {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    return info.pixelRatio || 2
  } catch (e) {
    return 2
  }
}

function hslToRgb(h, s, l) {
  s /= 100
  l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [
    Math.round(f(0) * 255),
    Math.round(f(8) * 255),
    Math.round(f(4) * 255)
  ]
}

function rgbToHex(rgb) {
  return '#' + rgb.map(v => {
    const s = Math.max(0, Math.min(255, v)).toString(16)
    return s.length === 1 ? '0' + s : s
  }).join('')
}
Page({

  data: {
    isEmpty: true,
    immersive: false,
    color: '#000000',
    lineWidth: 4,
    presetColors: PRESET_COLORS,
    showCustom: false,
    isCustom: false,
    customColor: '#1e5eff',
    hue: 220,
    light: 50,
    huePos: 0,
    lightPos: 0,
    hueBarWidth: 1,
    lightBarWidth: 1,
    lightBarStyle: 'background: linear-gradient(to right, #000000, hsl(220,100%,50%), #ffffff);',
    chainId: '',
    isChainMode: false
  },

  onLoad(options) {   // ← 括号里加上 options
    // 先初始化所有实例变量
    this.strokes = []
    this.currentStroke = null
    this.canvas = null
    this.ctx = null
    this.dpr = 2
    this.cssW = 0
    this.cssH = 0
    this.canvasRect = { left: 0, top: 0 }
    this.hueRect = null
    this.lightRect = null
    this.saving = false
  
    // 再接龙参数，判空保护
    const chainId = (options && options.chainId) || ''
    this.setData({
      chainId,
      isChainMode: !!chainId
    })
  },
  onReady() {
    this.waitForCanvas()
  },
  waitForCanvas(retry = 0) {
    wx.createSelectorQuery()
      .select('#signCanvas')
      .fields({ node: true, size: true, rect: true })
      .exec(res => {
        const item = res && res[0]
        if (!item || !item.node || !item.width) {
          if (retry < 10) {
            setTimeout(() => this.waitForCanvas(retry + 1), 100)
          }
          return
        }
        this.setupCanvas(item)
      })
  },
  setupCanvas(item) {
    const canvas = item.node
    const dpr = getDpr()
    canvas.width = Math.round(item.width * dpr)
    canvas.height = Math.round(item.height * dpr)
    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
  
    this.canvas = canvas
    this.ctx = ctx
    this.dpr = dpr
    this.cssW = item.width
    this.cssH = item.height
    this.canvasRect = { left: item.left, top: item.top }
    this.applyStyle()
    this.redraw()
  },
  initCanvas() {
    const ctx = wx.createCanvasContext('signCanvas', this)
    wx.createSelectorQuery()
      .select('.board')
      .boundingClientRect(rect => {
        if (!rect || !rect.width) return
        this.ctx = ctx
        this.cssW = rect.width
        this.cssH = rect.height
        this.dpr = getDpr()
        this.canvasRect = { left: rect.left, top: rect.top }
        this.applyStyle()
        this.redraw()
      })
      .exec()
  },

  applyStyle() {
    const ctx = this.ctx
    if (!ctx) return
    const { color, lineWidth } = this.data
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = lineWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  },

  getPoint(e) {
    const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
    if (!t) return null
  
    let x, y
    if (typeof t.x === 'number' && typeof t.y === 'number') {
      // 2d canvas 的 touch 坐标已经是相对 canvas 的逻辑坐标，直接用
      x = t.x
      y = t.y
    } else {
      x = t.clientX - this.canvasRect.left
      y = t.clientY - this.canvasRect.top
    }
  
    // 边界保护
    if (x < 0 || y < 0 || x > this.cssW || y > this.cssH) {
      return null
    }
  
    return { x, y }
  },
  onTouchStart(e) {
    if (!this.ctx) return
    const p = this.getPoint(e)
    if (!p) return

    this.applyStyle()

    const stroke = {
      color: this.data.color,
      width: this.data.lineWidth,
      points: [p]
    }
    this.currentStroke = stroke
    this.strokes.push(stroke)

    const ctx = this.ctx
    ctx.beginPath()
    ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2)
    ctx.fillStyle = stroke.color
    ctx.fill()

    if (this.data.isEmpty) {
      this.setData({ isEmpty: false })
    }
  },

  onTouchMove(e) {
    const stroke = this.currentStroke
    if (!stroke || !this.ctx) return

    const p = this.getPoint(e)
    if (!p) return

    const pts = stroke.points
    const last = pts[pts.length - 1]

    const dx = p.x - last.x
    const dy = p.y - last.y
    if (dx * dx + dy * dy < 0.8) return

    pts.push(p)

    const ctx = this.ctx
    ctx.strokeStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    const n = pts.length

    if (n === 2) {
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      ctx.lineTo(pts[1].x, pts[1].y)
      ctx.stroke()
    } else {
      const i = n - 2
      const prev2 = pts[i - 1]
      const ctrl = pts[i]
      const cur = pts[i + 1]

      const startX = (prev2.x + ctrl.x) / 2
      const startY = (prev2.y + ctrl.y) / 2
      const endX = (ctrl.x + cur.x) / 2
      const endY = (ctrl.y + cur.y) / 2

      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.quadraticCurveTo(ctrl.x, ctrl.y, endX, endY)
      ctx.stroke()
    }
  },

  onTouchEnd() {
    const stroke = this.currentStroke
    if (!stroke || !this.ctx) {
      this.currentStroke = null
      return
    }

    const pts = stroke.points
    if (pts.length >= 2) {
      const last = pts[pts.length - 1]
      const prev = pts[pts.length - 2]
      const midX = (prev.x + last.x) / 2
      const midY = (prev.y + last.y) / 2

      const ctx = this.ctx
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(midX, midY)
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }

    this.currentStroke = null
  },

  drawStroke(stroke) {
    const ctx = this.ctx
    if (!ctx) return

    const pts = stroke.points
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.lineWidth = stroke.width
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (pts.length === 1) {
      ctx.beginPath()
      ctx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2)
      ctx.fill()
      return
    }

    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2
      const my = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
    }
    const last = pts[pts.length - 1]
    ctx.lineTo(last.x, last.y)
    ctx.stroke()
  },

  redraw() {
    const ctx = this.ctx
    if (!ctx) return
    ctx.clearRect(0, 0, this.cssW, this.cssH)
    this.strokes.forEach(s => this.drawStroke(s))

    const empty = this.strokes.length === 0
    if (empty !== this.data.isEmpty) {
      this.setData({ isEmpty: empty })
    }
  },

  undo() {
    if (!this.strokes.length) {
      wx.showToast({ title: '没有可撤销的笔迹', icon: 'none' })
      return
    }
    this.strokes.pop()
    this.redraw()
  },

  clear() {
    if (!this.strokes.length) return
    wx.showModal({
      title: '重写签名',
      content: '确定要清空当前签名，重新书写吗？',
      confirmColor: '#07c160',
      success: res => {
        if (res.confirm) {
          this.strokes = []
          this.redraw()
        }
      }
    })
  },

  onPickColor(e) {
    const color = e.currentTarget.dataset.color
    this.setData({ color, isCustom: false })
    this.applyStyle()
  },

  toggleCustom() {
    const show = !this.data.showCustom
    this.setData({ showCustom: show }, () => {
      if (show) {
        wx.nextTick(() => this.measureBars())
      }
    })
  },

  measureBars() {
    wx.createSelectorQuery()
      .select('#hueBar')
      .boundingClientRect()
      .select('#lightBar')
      .boundingClientRect()
      .exec(res => {
        const hueRect = res && res[0]
        const lightRect = res && res[1]
        if (!hueRect || !lightRect) return

        this.hueRect = hueRect
        this.lightRect = lightRect

        this.setData({
          hueBarWidth: hueRect.width || 1,
          lightBarWidth: lightRect.width || 1,
          huePos: (this.data.hue / 360) * (hueRect.width || 1),
          lightPos: (this.data.light / 100) * (lightRect.width || 1)
        })
        this.updateCustomColor()
      })
  },

  onHueTouch(e) {
    const rect = this.hueRect
    if (!rect || !rect.width) return
    const t = e.touches && e.touches[0]
    if (!t) return

    let x = t.clientX - rect.left
    x = Math.max(0, Math.min(rect.width, x))

    this.setData({
      hue: Math.round((x / rect.width) * 360),
      huePos: x
    })
    this.updateCustomColor()
  },

  onLightTouch(e) {
    const rect = this.lightRect
    if (!rect || !rect.width) return
    const t = e.touches && e.touches[0]
    if (!t) return

    let x = t.clientX - rect.left
    x = Math.max(0, Math.min(rect.width, x))

    this.setData({
      light: Math.round((x / rect.width) * 100),
      lightPos: x
    })
    this.updateCustomColor()
  },

  updateCustomColor() {
    const { hue, light } = this.data
    const hex = rgbToHex(hslToRgb(hue, 100, light))
    this.setData({
      customColor: hex,
      lightBarStyle: `background: linear-gradient(to right, #000000, hsl(${hue},100%,50%), #ffffff);`
    })
  },

  useCustomColor() {
    this.setData({
      color: this.data.customColor,
      isCustom: true,
      showCustom: false
    })
    this.applyStyle()
  },

  onWidthChanging(e) {
    this.setData({ lineWidth: e.detail.value })
  },

  onWidthChange(e) {
    this.setData({ lineWidth: e.detail.value })
    this.applyStyle()
  },

  toggleFull() {
    const immersive = !this.data.immersive
    this.setData({ immersive }, () => {
      wx.nextTick(() => {
        this.waitForCanvas()
      })
    })
  },

  getCropBox() {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    this.strokes.forEach(s => {
      const r = s.width / 2 + 2
      s.points.forEach(p => {
        if (p.x - r < minX) minX = p.x - r
        if (p.y - r < minY) minY = p.y - r
        if (p.x + r > maxX) maxX = p.x + r
        if (p.y + r > maxY) maxY = p.y + r
      })
    })

    const pad = 28
    const x = Math.max(0, minX - pad)
    const y = Math.max(0, minY - pad)
    const w = Math.max(40, Math.min(this.cssW, maxX + pad) - x)
    const h = Math.max(40, Math.min(this.cssH, maxY + pad) - y)

    return { x, y, w, h }
  },

  save() {
    if (!this.strokes.length) {
      wx.showToast({ title: '请先书写签名', icon: 'none' })
      return
    }
    if (this.saving) return
  
    this.saving = true
    wx.showLoading({ title: '生成中...', mask: true })
  
    const box = this.getCropBox()
  
    const offCanvas = wx.createOffscreenCanvas({
      type: '2d',
      width: Math.round(box.w),
      height: Math.round(box.h)
    })
    const offCtx = offCanvas.getContext('2d')
  
    offCtx.translate(-box.x, -box.y)
  
    this.strokes.forEach(stroke => {
      const pts = stroke.points
      offCtx.strokeStyle = stroke.color
      offCtx.fillStyle = stroke.color
      offCtx.lineWidth = stroke.width
      offCtx.lineCap = 'round'
      offCtx.lineJoin = 'round'
  
      if (pts.length === 1) {
        offCtx.beginPath()
        offCtx.arc(pts[0].x, pts[0].y, stroke.width / 2, 0, Math.PI * 2)
        offCtx.fill()
        return
      }
  
      offCtx.beginPath()
      offCtx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2
        const my = (pts[i].y + pts[i + 1].y) / 2
        offCtx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
      }
      const last = pts[pts.length - 1]
      offCtx.lineTo(last.x, last.y)
      offCtx.stroke()
    })
  
    wx.canvasToTempFilePath({
      canvas: offCanvas,
      x: 0,
      y: 0,
      width: offCanvas.width,
      height: offCanvas.height,
      destWidth: offCanvas.width * this.dpr,
      destHeight: offCanvas.height * this.dpr,
      fileType: 'png',
      success: res => {
        wx.hideLoading()
        this.saving = false
  
        // 原有：保存到相册
        this.saveToAlbum(res.tempFilePath)
  
        // 新增：上传云存储
        this.saveToCloud(res.tempFilePath)
      },
      fail: err => {
        console.error('canvasToTempFilePath fail:', err)
        wx.hideLoading()
        this.saving = false
        wx.showToast({ title: '生成图片失败', icon: 'none' })
      }
    }, this)
  },
  saveToAlbum(filePath) {
    wx.saveImageToPhotosAlbum({
      filePath,
      success: () => {
        wx.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: err => {
        const msg = (err && err.errMsg) || ''
        if (msg.indexOf('auth') > -1 || msg.indexOf('deny') > -1) {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启「保存到相册」权限后再试',
            confirmText: '去设置',
            confirmColor: '#07c160',
            success: r => {
              if (r.confirm) wx.openSetting()
            }
          })
        } else if (msg.indexOf('cancel') === -1) {
          wx.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  },
  async saveToCloud(filePath) {
    try {
      // 上传到云存储
      const cloudPath = `signatures/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
      const uploadRes = await wx.cloud.uploadFile({
        cloudPath,
        filePath
      })
  
      // 写入签名记录
      await db.collection('signatures').add({
        data: {
          fileID: uploadRes.fileID,
          lineWidth: this.data.lineWidth,
          color: this.data.color,
          createTime: db.serverDate()
        }
      })
  
      // 如果是接龙模式，额外写入接龙签名记录
      if (this.data.isChainMode && this.data.chainId) {
        await this.submitChainSign(uploadRes.fileID)
      }
  
      console.log('云存储保存成功', uploadRes.fileID)
    } catch (err) {
      console.error('云存储保存失败', err)
      // 不打扰用户，本地相册已保存成功
    }
  },
  
  async submitChainSign(fileID) {
    try {
      await db.collection('chain_signatures').add({
        data: {
          chainId: this.data.chainId,
          fileID,
          signTime: db.serverDate()
        }
      })
      wx.showToast({ title: '接龙签名已提交', icon: 'success' })
    } catch (err) {
      console.error('接龙签名提交失败', err)
      wx.showToast({ title: '接龙提交失败', icon: 'none' })
    }
  }

})
const config = require('../../config/fileSignPage')
const fileSignService = require('../../services/fileSignService')
const signatureService = require('../../services/signatureService')
const unlockPolicy = require('../../services/unlockPolicy')

Page({
  data: {
    actions: config.actions,
    fileTypes: config.fileTypes,
    signatureSources: config.signatureSources,
    filePath: '', fileName: '', fileType: '', signaturePath: '', canExport: false,
    signaturePickerVisible: false, filePickerVisible: false, signX: 70, signY: 220, signWidth: 190
  },
  onLoad() {
    this.signatureRect = { x: 70, y: 220, width: 190 }
    this.touchStart = null
    this.exportCanvas = null
    this.exportCtx = null
    this.signatureChannelHandler = payload => {
      if (payload && payload.tempFilePath) this.setSignature(payload.tempFilePath)
    }
  },
  onReady() {
    wx.createSelectorQuery().select('#exportCanvas').fields({ node: true }).exec(res => {
      const item = res && res[0]
      if (!item || !item.node) return
      this.exportCanvas = item.node
      this.exportCtx = item.node.getContext('2d')
    })
  },
  updateCanExport(extra) {
    const values = Object.assign({}, this.data, extra || {})
    this.setData({ canExport: !!(values.filePath && values.signaturePath) })
  },
  openFilePicker() { this.setData({ filePickerVisible: true }) },
  closeFilePicker() { this.setData({ filePickerVisible: false }) },
  chooseFile() {
    this.closeFilePicker()
    wx.chooseMessageFile({ count: 1, type: 'all', extension: config.fileTypes.reduce((all, type) => all.concat(type.extensions), []), success: res => this.useSelectedFile(res.tempFiles[0]) })
  },
  useSelectedFile(file) {
    if (!file || !file.path) return
    const type = fileSignService.getFileType(file.path)
    if (!config.fileTypes.some(entry => entry.extensions.includes(type))) {
      wx.showToast({ title: '请选择 PDF 或图片文件', icon: 'none' })
      return
    }
    this.setData({ filePath: file.path, fileName: file.name || file.path.split('/').pop(), fileType: type })
    this.updateCanExport({ filePath: file.path })
    this.measureStage()
  },
  chooseFromAlbum() {
    this.closeFilePicker()
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: res => {
      const f = res.tempFiles[0]
      this.useSelectedFile({ path: f.tempFilePath, name: `图片.${fileSignService.getFileType(f.tempFilePath) || 'jpg'}` })
    } })
  },
  openPdf() {
    wx.openDocument({ filePath: this.data.filePath, fileType: 'pdf', showMenu: true, fail: () => wx.showToast({ title: '无法预览此PDF', icon: 'none' }) })
  },
  measureStage() {
    wx.createSelectorQuery().select('#imageStage').boundingClientRect(rect => {
      if (!rect) return
      this.stageRect = rect
      this.signatureRect = Object.assign({}, this.signatureRect, { x: Math.round(rect.width * .2), y: Math.round(rect.height * .55) })
      this.setData({ signX: this.signatureRect.x, signY: this.signatureRect.y })
    }).exec()
  },
  openSignaturePicker() { this.setData({ signaturePickerVisible: true }) },
  closeSignaturePicker() { this.setData({ signaturePickerVisible: false }) },
  noop() {},
  chooseSavedSignature() {
    this.closeSignaturePicker()
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: res => this.setSignature(res.tempFiles[0].tempFilePath) })
  },
  createSignature() {
    this.closeSignaturePicker()
    wx.navigateTo({ url: '/pages/signature/index', events: { signatureCreated: this.signatureChannelHandler } })
  },
  setSignature(path) {
    this.signatureRect = Object.assign({}, this.signatureRect, { width: 190 })
    this.setData({ signaturePath: path, signWidth: this.signatureRect.width })
    this.updateCanExport({ signaturePath: path })
  },
  onSignTouchStart(e) {
    const touch = e.touches[0]
    this.touchStart = { x: touch.clientX, y: touch.clientY, signX: this.signatureRect.x, signY: this.signatureRect.y }
  },
  onSignTouchMove(e) {
    if (!this.touchStart) return
    const touch = e.touches[0]
    const x = Math.max(0, Math.min((this.stageRect && this.stageRect.width || 600) - this.signatureRect.width, this.touchStart.signX + touch.clientX - this.touchStart.x))
    const y = Math.max(0, Math.min((this.stageRect && this.stageRect.height || 900) - 80, this.touchStart.signY + touch.clientY - this.touchStart.y))
    this.signatureRect.x = x
    this.signatureRect.y = y
    this.setData({ signX: x, signY: y })
  },
  onResizeStart(e) {
    const touch = e.touches[0]
    this.resizeStart = { x: touch.clientX, width: this.signatureRect.width }
  },
  onResizeMove(e) {
    if (!this.resizeStart) return
    const touch = e.touches[0]
    const width = Math.max(80, Math.min(360, this.resizeStart.width + touch.clientX - this.resizeStart.x))
    this.signatureRect.width = width
    this.setData({ signWidth: width })
  },
  async downloadFile() {
    if (!this.data.filePath || !this.data.signaturePath) {
      wx.showToast({ title: '请先选择文件和签名', icon: 'none' })
      return
    }
    if (!await unlockPolicy.check('exportFile')) return
    if (this.data.fileType === 'pdf') {
      wx.showModal({ title: 'PDF导出', content: 'PDF签名合成需要配置后端处理服务，当前可先打开原文件预览。', showCancel: false, confirmText: '知道了' })
      return
    }
    try {
      wx.showLoading({ title: '正在合成', mask: true })
      const size = await this.getImageSize(this.data.filePath)
      const stage = this.stageRect || { width: 375, height: 600 }
      const fit = Math.min(stage.width / size.width, stage.height / size.height)
      const viewW = size.width * fit, viewH = size.height * fit
      const imageLeft = (stage.width - viewW) / 2, imageTop = (stage.height - viewH) / 2
      const rect = { x: Math.max(0, this.signatureRect.x - imageLeft), y: Math.max(0, this.signatureRect.y - imageTop), width: this.signatureRect.width, height: this.signatureRect.width * .38 }
      const output = await fileSignService.composeImage({ canvas: this.exportCanvas, filePath: this.data.filePath, signaturePath: this.data.signaturePath, signatureRect: rect, width: stage.width, height: stage.height })
      await signatureService.saveToAlbum(output)
      wx.hideLoading()
      wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '导出失败', icon: 'none' })
    }
  },
  getImageSize(path) {
    return new Promise((resolve, reject) => wx.getImageInfo({ src: path, success: info => resolve({ width: info.width, height: info.height }), fail: reject }))
  }
})

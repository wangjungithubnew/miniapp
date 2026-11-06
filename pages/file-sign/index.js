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
    signaturePickerVisible: false, filePickerVisible: false, textSignatureVisible: false, textSignature: '', signedPdfPath: '', signedPdfReady: false, signX: 70, signY: 220, signWidth: 190, signHeight: 74, signatureReady: false, fileSheetItems: config.fileSources, signatureSheetItems: config.signatureSources
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
  onShow() {
    const cached = wx.getStorageSync('lastSignaturePath')
    if (cached && cached !== this.data.signaturePath) this.setSignature(cached)
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
    this.setData({ canExport: !!(values.filePath && (values.signaturePath || values.textSignature)) })
  },
  openFilePicker() { this.setData({ filePickerVisible: true }) },
  closeFilePicker() { this.setData({ filePickerVisible: false }) },
  onFileSourceTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'cancel') return this.closeFilePicker()
    if (id === 'pdf') return this.choosePdf()
    if (id === 'image') return this.chooseFromAlbum()
  },
  chooseFile() {
    this.closeFilePicker()
    wx.chooseMessageFile({ count: 1, type: 'all', extension: config.fileTypes.reduce((all, type) => all.concat(type.extensions), []), success: res => this.useSelectedFile(res.tempFiles[0]) })
  },
  choosePdf() {
    this.closeFilePicker()
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['pdf'], success: res => this.useSelectedFile(res.tempFiles[0]) })
  },
  chooseCamera() {
    this.closeFilePicker()
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['camera'], success: res => {
      const f = res.tempFiles[0]
      this.useSelectedFile({ path: f.tempFilePath, name: `拍摄文件.${fileSignService.getFileType(f.tempFilePath) || 'jpg'}` })
    } })
  },
  useSelectedFile(file) {
    if (!file || !file.path) return
    const type = fileSignService.getFileType(file.path, file.name, file.type)
    if (!config.fileTypes.some(entry => entry.extensions.includes(type))) {
      wx.showToast({ title: '请选择 PDF 或图片文件', icon: 'none' })
      return
    }
    const fileName = file.name || file.path.split('/').pop()
    this.setData({ filePath: file.path, fileName, fileType: type, signedPdfPath: '', signedPdfReady: false })
    this.updateCanExport({ filePath: file.path })
    this.measureStage()
    if (type === 'pdf') {
      setTimeout(() => this.openPdf(), 120)
    }
  },
  chooseFromAlbum() {
    this.closeFilePicker()
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: res => {
      const f = res.tempFiles[0]
      this.useSelectedFile({ path: f.tempFilePath, name: `图片.${fileSignService.getFileType(f.tempFilePath) || 'jpg'}` })
    } })
  },
  openPdf() {
    wx.openDocument({ filePath: this.data.filePath, fileType: 'pdf', showMenu: true, success: () => {}, fail: err => wx.showToast({ title: (err && err.errMsg) || '无法预览此PDF', icon: 'none' }) })
  },
  measureStage() {
    wx.createSelectorQuery().select('.workspace').boundingClientRect(rect => {
      if (!rect) return
      this.stageRect = rect
      this.signatureRect = Object.assign({}, this.signatureRect, { x: Math.round(rect.width * .2), y: Math.round(rect.height * .55) })
      this.setData({ signX: this.signatureRect.x, signY: this.signatureRect.y })
    }).exec()
  },
  openSignaturePicker() { this.setData({ signaturePickerVisible: true }) },
  closeSignaturePicker() { this.setData({ signaturePickerVisible: false }) },
  noop() {},
  onSignatureSourceTap(e) {
    const id = e.currentTarget.dataset.id
    if (id === 'cancel') return this.closeSignaturePicker()
    if (id === 'hand') return this.createSignature()
    if (id === 'text') return this.openTextSignature()
  },
  openTextSignature() {
    this.closeSignaturePicker()
    this.setData({ textSignatureVisible: true, textSignature: '' })
  },
  closeTextSignature() { this.setData({ textSignatureVisible: false }) },
  onTextInput(e) { this.setData({ textSignature: e.detail.value }) },
  confirmTextSignature() {
    const value = (this.data.textSignature || '').trim()
    if (!value) return wx.showToast({ title: '请输入签名文字', icon: 'none' })
    this.setData({ textSignatureVisible: false, signatureReady: true, signaturePath: '', signWidth: Math.max(150, value.length * 34), signHeight: 58 })
    this.updateCanExport({ signaturePath: '' })
  },
  chooseSavedSignature() {
    this.closeSignaturePicker()
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album'], success: res => this.setSignature(res.tempFiles[0].tempFilePath) })
  },
  createSignature() {
    this.closeSignaturePicker()
    wx.navigateTo({ url: '/pages/signature/index', events: { signatureCreated: this.signatureChannelHandler } })
  },
  createDateSignature() {
    this.closeSignaturePicker()
    wx.showToast({ title: '年月日签名即将开放', icon: 'none' })
  },
  setSignature(path) {
    if (!path) return
    const apply = info => {
      const width = 190
      const height = Math.max(44, Math.round(width * (info.height / Math.max(1, info.width))))
      this.signatureRect = Object.assign({}, this.signatureRect, { width, height })
      this.setData({ signaturePath: path, signatureReady: true, signWidth: width, signHeight: height, signX: this.signatureRect.x, signY: this.signatureRect.y })
      this.updateCanExport({ signaturePath: path })
    }
    wx.getImageInfo({ src: path, success: apply, fail: () => {
      // 部分基础库对 savedFilePath 读取更稳定，尝试重新保存一次临时文件。
      wx.saveFile({ tempFilePath: path, success: res => wx.getImageInfo({ src: res.savedFilePath, success: info => apply(info), fail: () => this.signatureReadError() }), fail: () => this.signatureReadError() })
    } })
  },
  signatureReadError() { wx.showToast({ title: '签名图片暂时无法读取，请重新生成', icon: 'none' }) },
  onSignatureError() {
    this.setData({ signatureReady: false })
    wx.showToast({ title: '签名图层加载失败，请重新选择', icon: 'none' })
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
      return this.exportPdfWithCloud()
    }
    try {
      wx.showLoading({ title: '正在合成', mask: true })
      const size = await this.getImageSize(this.data.filePath)
      const stage = this.stageRect || { width: 375, height: 600 }
      const fit = Math.min(stage.width / size.width, stage.height / size.height)
      const viewW = size.width * fit, viewH = size.height * fit
      const imageLeft = (stage.width - viewW) / 2, imageTop = (stage.height - viewH) / 2
      const rect = { x: Math.max(0, this.signatureRect.x - imageLeft), y: Math.max(0, this.signatureRect.y - imageTop), width: this.signatureRect.width, height: this.signatureRect.height || this.signatureRect.width * .38 }
      const output = await fileSignService.composeImage({ canvas: this.exportCanvas, filePath: this.data.filePath, signaturePath: this.data.signaturePath, signatureRect: rect, width: stage.width, height: stage.height })
      await signatureService.saveToAlbum(output)
      wx.hideLoading()
      wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      wx.showToast({ title: err.message || '导出失败', icon: 'none' })
    }
  },
  async exportPdfWithCloud() {
    if (!wx.cloud || !wx.cloud.uploadFile || !wx.cloud.callFunction) {
      wx.showToast({ title: '请先启用微信云开发', icon: 'none' })
      return
    }
    try {
      wx.showLoading({ title: '正在生成 PDF', mask: true })
      const [pdf, signature] = await Promise.all([
        wx.cloud.uploadFile({ cloudPath: `source/${Date.now()}.pdf`, filePath: this.data.filePath }),
        wx.cloud.uploadFile({ cloudPath: `signature/${Date.now()}.png`, filePath: this.data.signaturePath })
      ])
      const stage = this.stageRect || { width: 375, height: 600 }
      const result = await wx.cloud.callFunction({ name: 'mergePdf', data: {
        pdfFileID: pdf.fileID, signatureFileID: signature.fileID,
        x: this.signatureRect.x, y: this.signatureRect.y,
        width: this.signatureRect.width, height: this.signatureRect.height,
        stageWidth: stage.width, stageHeight: stage.height
      } })
      const fileID = result && result.result && result.result.fileID
      if (!fileID) throw new Error('云函数未返回 PDF 文件')
      const downloaded = await wx.cloud.downloadFile({ fileID })
      this.setData({ signedPdfPath: downloaded.tempFilePath, signedPdfReady: true })
      wx.showToast({ title: 'PDF 签名已生成', icon: 'success' })
    } catch (err) {
      const message = err && (err.errMsg || err.message) || ''
      console.error('mergePdf failed', err)
      if (/504003|TIME_LIMIT|timed out|超时/i.test(message)) {
        wx.showModal({ title: 'PDF 合成超时', content: '云函数当前执行时间限制为 3 秒。请在云开发控制台将 mergePdf 的超时时间调整为 20 秒以上，并建议将 PDF 控制在 10MB 以内。', showCancel: false })
      } else if (/501000|environment|env|未初始化|not init/i.test(message)) {
        wx.showModal({ title: '云开发环境不可用', content: '请在 app.js 配置真实的云开发环境 ID，并部署 mergePdf 云函数后重试。', showCancel: false })
      } else if (/mergePdf|function|函数|not found/i.test(message)) {
        wx.showModal({ title: '云函数未部署', content: '请在微信开发者工具中右键 cloudfunctions/mergePdf，选择“上传并部署：云端安装依赖”。', showCancel: false })
      } else {
        wx.showToast({ title: message || 'PDF 合成失败', icon: 'none' })
      }
    } finally {
      wx.hideLoading()
    }
  },
  previewSignedPdf() {
    if (!this.data.signedPdfPath) return wx.showToast({ title: '请先生成签字 PDF', icon: 'none' })
    wx.openDocument({ filePath: this.data.signedPdfPath, fileType: 'pdf', showMenu: true, fail: err => wx.showToast({ title: err.errMsg || '预览失败', icon: 'none' }) })
  },
  saveSignedPdf() {
    const path = this.data.signedPdfPath
    if (!path) return wx.showToast({ title: '请先生成签字 PDF', icon: 'none' })
    wx.saveFile({ tempFilePath: path, success: res => {
      this.setData({ signedPdfPath: res.savedFilePath || path })
      wx.showModal({ title: '下载完成', content: '文件已保存到小程序本地文件，可在预览页面使用微信菜单转发或保存。', showCancel: false, confirmText: '知道了' })
    }, fail: err => wx.showToast({ title: err.errMsg || '下载失败', icon: 'none' }) })
  },
  getImageSize(path) {
    return new Promise((resolve, reject) => wx.getImageInfo({ src: path, success: info => resolve({ width: info.width, height: info.height }), fail: reject }))
  }
})

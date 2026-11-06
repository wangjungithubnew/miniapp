function getFileType(path, name, mime) {
  const match = String(name || path || '').match(/\.([a-z0-9]+)(?:$|\?)/i)
  if (!match && String(mime || '').includes('pdf')) return 'pdf'
  return match ? match[1].toLowerCase() : ''
}

function loadImage(canvas, src) {
  return new Promise((resolve, reject) => {
    const image = canvas.createImage()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

async function composeImage(options) {
  const { canvas, filePath, signaturePath, signatureRect, width, height } = options
  const base = await loadImage(canvas, filePath)
  const signature = await loadImage(canvas, signaturePath)
  const scale = Math.min(1, 2400 / Math.max(base.width, base.height))
  const outW = Math.max(1, Math.round(base.width * scale))
  const outH = Math.max(1, Math.round(base.height * scale))
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, outW, outH)
  ctx.drawImage(base, 0, 0, outW, outH)
  const sx = outW / width, sy = outH / height
  ctx.drawImage(signature, signatureRect.x * sx, signatureRect.y * sy, signatureRect.width * sx, signatureRect.height * sy)
  return new Promise((resolve, reject) => {
    wx.canvasToTempFilePath({ canvas, x: 0, y: 0, width: outW, height: outH, destWidth: outW, destHeight: outH, fileType: 'png', success: res => resolve(res.tempFilePath), fail: reject })
  })
}

async function exportPdf(options) {
  // 小程序端不能直接改写 PDF，统一通过业务层注入的处理器完成合成。
  if (typeof options.processPdf === 'function') return options.processPdf(options)
  if (options && options.endpoint) {
    return new Promise((resolve, reject) => wx.uploadFile({
      url: options.endpoint, filePath: options.filePath, name: 'file',
      formData: { signaturePath: options.signaturePath, x: options.signatureRect.x, y: options.signatureRect.y, width: options.signatureRect.width, height: options.signatureRect.height },
      success: res => { try { const data = JSON.parse(res.data || '{}'); data.filePath ? resolve(data.filePath) : reject(new Error(data.message || 'PDF合成失败')) } catch (e) { reject(new Error('PDF合成服务返回数据无效')) } },
      fail: reject
    }))
  }
  throw new Error('当前项目尚未配置 PDF 合成服务，请先配置后端接口')
}

module.exports = { getFileType, composeImage, exportPdf }

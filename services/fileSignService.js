function getFileType(path) {
  const match = String(path || '').match(/\.([a-z0-9]+)(?:$|\?)/i)
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
  // PDF 的页面合成需要服务端 PDF 渲染/回写能力。保留清晰接口供云函数或后端接入。
  if (typeof options.processPdf !== 'function') {
    throw new Error('PDF签名导出需要配置后端PDF处理服务')
  }
  return options.processPdf(options)
}

module.exports = { getFileType, composeImage, exportPdf }

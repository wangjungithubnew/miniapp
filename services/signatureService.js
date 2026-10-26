function saveToAlbum(filePath) {
  return new Promise((resolve, reject) => {
    wx.saveImageToPhotosAlbum({ filePath, success: resolve, fail: reject })
  })
}

async function exportSignature(filePath, options) {
  await saveToAlbum(filePath)
  if (options && options.upload) await options.upload(filePath)
  return { filePath }
}

module.exports = { saveToAlbum, exportSignature }

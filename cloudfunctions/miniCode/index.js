const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

exports.main = async () => {
  const result = await cloud.openapi.wxacode.getUnlimited({
    scene: 'home',
    page: 'pages/home/index',
    width: 430,
    checkPath: false
  })
  if (!result.buffer) throw new Error('生成小程序码失败')
  const upload = await cloud.uploadFile({
    cloudPath: `mini-code/home-${Date.now()}.png`,
    fileContent: result.buffer
  })
  return { fileID: upload.fileID }
}

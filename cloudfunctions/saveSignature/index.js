const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { fileID, lineWidth, color } = event

  const res = await db.collection('signatures').add({
    data: {
      _openid: OPENID,
      fileID,
      lineWidth,
      color,
      createTime: db.serverDate()
    }
  })
  return { success: true, id: res._id }
}
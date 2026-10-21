const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { chainId, fileID } = event

  await db.collection('chain_signatures').add({
    data: {
      _openid: OPENID,
      chainId,
      fileID,
      signTime: db.serverDate()
    }
  })
  return { success: true }
}
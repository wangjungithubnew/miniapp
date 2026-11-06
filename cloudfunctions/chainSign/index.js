const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { action, taskId, title, description, participants, displayName } = event
  const tasks = db.collection('task_sign_tasks')
  const signatures = db.collection('task_signatures')
  if (action === 'create') {
    if (!title) throw new Error('任务名称不能为空')
    const res = await tasks.add({ data: { title, description: description || '', participants: participants || [], ownerOpenid: OPENID, createdAt: db.serverDate() } })
    return { taskId: res._id, owner: true }
  }
  if (action === 'get') {
    const task = await tasks.doc(taskId).get()
    const signed = await signatures.where({ taskId }).get()
    return { task: Object.assign({}, task.data, { id: task.data._id }), signatures: signed.data }
  }
  if (action === 'sign') {
    if (!taskId || !displayName) throw new Error('缺少签名信息')
    const existing = await signatures.where({ taskId, _openid: OPENID }).get()
    if (existing.data.length) return { alreadySigned: true }
    await signatures.add({ data: { taskId, displayName, _openid: OPENID, createdAt: db.serverDate() } })
    return { success: true }
  }
  if (action === 'list') {
    const res = await tasks.where({ ownerOpenid: OPENID }).get()
    return { tasks: res.data.map(item => Object.assign({}, item, { id: item._id })) }
  }
  if (action === 'delete') {
    const task = await tasks.doc(taskId).get()
    if (task.data.ownerOpenid !== OPENID) throw new Error('无权删除此任务')
    await Promise.all([tasks.doc(taskId).remove(), signatures.where({ taskId }).remove()])
    return { success: true }
  }
  throw new Error('不支持的操作')
}

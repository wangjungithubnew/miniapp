Page({
  data: { tasks: [], sharedTask: null, signatures: [], createVisible: false, signVisible: false, titleInput: '', descriptionInput: '', participantInput: '', signerName: '' },
  onLoad(options) { this.taskId = options.taskId || ''; this.options = options || {}; this.taskId ? this.loadTask() : this.loadTasks() },
  onShow() { if (!this.taskId) this.loadTasks() },
  async call(data) { return (await wx.cloud.callFunction({ name: 'chainSign', data })).result },
  async loadTasks() { try { this.setData({ tasks: (await this.call({ action: 'list' })).tasks || [] }) } catch (e) { this.fail(e) } },
  async loadTask() { try { const r = await this.call({ action: 'get', taskId: this.taskId }); this.setData({ sharedTask: r.task, signatures: r.signatures || [] }); wx.setNavigationBarTitle({ title: r.task.title }) } catch (e) { this.fail(e) } },
  fail(e) {
    const message = (e && (e.message || e.errMsg)) || '操作失败'
    console.error('task-sign failed', e)
    if (/-50400|FUNCTIONS_EXECUTE_FAIL|collection|集合|database/i.test(message)) {
      wx.showModal({ title: '任务服务未准备完成', content: '请在云开发控制台的“数据库”中新建 task_sign_tasks 和 task_signatures 两个集合，然后重新部署 chainSign 云函数。', showCancel: false })
      return
    }
    wx.showToast({ title: message, icon: 'none' })
  }, noop() {},
  onInput(e) { this.setData({ [e.currentTarget.dataset.field]: e.detail.value }) },
  openCreate() { this.setData({ createVisible: true, titleInput: '', descriptionInput: '', participantInput: '' }) }, closeCreate() { this.setData({ createVisible: false }) }, closeSign() { this.setData({ signVisible: false }) },
  async createTask() { const title = this.data.titleInput.trim(); if (!title) return this.fail({ message: '请输入任务名称' }); try { const participants = this.data.participantInput.split(/[，,\n]/).map(x => x.trim()).filter(Boolean); const r = await this.call({ action: 'create', title, description: this.data.descriptionInput.trim(), participants }); this.setData({ createVisible: false }); wx.navigateTo({ url: `/pages/task-sign/index?taskId=${r.taskId}` }) } catch (e) { this.fail(e) } },
  openTask(e) { wx.navigateTo({ url: `/pages/task-sign/index?taskId=${e.currentTarget.dataset.id}` }) },
  openSign() { this.setData({ signVisible: true, signerName: '' }) },
  async confirmSign() { const displayName = this.data.signerName.trim(); if (!displayName) return this.fail({ message: '请输入您的姓名' }); try { const r = await this.call({ action: 'sign', taskId: this.taskId, displayName }); this.setData({ signVisible: false }); wx.showToast({ title: r.alreadySigned ? '您已签名' : '签名成功', icon: 'success' }); this.loadTask() } catch (e) { this.fail(e) } },
  deleteTask(e) { const taskId = e.currentTarget.dataset.id; wx.showModal({ title: '删除任务', content: '删除后所有签名记录也会删除，确定继续吗？', confirmColor: '#d95778', success: async r => { if (!r.confirm) return; try { await this.call({ action: 'delete', taskId }); this.loadTasks() } catch (err) { this.fail(err) } } }) },
  onShareAppMessage() {
    const taskId = this.taskId || this.options.taskId
    if (!taskId) return { title: '任务签名', path: '/pages/task-sign/index' }
    const title = this.data.sharedTask && this.data.sharedTask.title || '任务确认'
    return { title: `邀请你签名：${title}`, path: `/pages/task-sign/index?taskId=${encodeURIComponent(taskId)}` }
  }
})

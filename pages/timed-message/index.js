const KEY = 'timedMessages'

function timeText(value) {
  const date = new Date(value); const p = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

Page({
  data: { messages: [], createVisible: false, content: '', sendAt: '', minDate: '', minTime: '00:00' },
  onShow() { this.load() },
  load() {
    const messages = (wx.getStorageSync(KEY) || []).map(item => Object.assign({}, item, { status: item.sendAt <= Date.now() ? '已到时间' : '待发送', displayTime: timeText(item.sendAt) }))
    const now = new Date(); const p = n => String(n).padStart(2, '0')
    this.setData({ messages, minDate: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}` })
  },
  openCreate() { const now = new Date(); const p = n => String(n).padStart(2, '0'); this.setData({ createVisible: true, content: '', sendAt: `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}T${p(now.getHours())}:${p(now.getMinutes())}` }) },
  closeCreate() { this.setData({ createVisible: false }) },
  onInput(e) { this.setData({ content: e.detail.value }) },
  onDateChange(e) { const value = e.detail.value; this.setData({ sendAt: `${value}T${(this.data.sendAt.split('T')[1] || '09:00')}` }) },
  onTimeChange(e) { this.setData({ sendAt: `${this.data.sendAt.split('T')[0]}T${e.detail.value}` }) },
  create() {
    const content = this.data.content.trim(); const time = new Date(this.data.sendAt).getTime()
    if (!content) return wx.showToast({ title: '请输入消息内容', icon: 'none' })
    if (!time || time <= Date.now()) return wx.showToast({ title: '请选择未来时间', icon: 'none' })
    const messages = [{ id: `msg_${Date.now()}`, content, sendAt: time }].concat(wx.getStorageSync(KEY) || [])
    wx.setStorageSync(KEY, messages); this.setData({ createVisible: false }); this.load(); wx.showToast({ title: '已安排消息', icon: 'success' })
  },
  copy(e) { wx.setClipboardData({ data: e.currentTarget.dataset.content, success: () => wx.showToast({ title: '消息已复制', icon: 'success' }) }) },
  remove(e) { const id = e.currentTarget.dataset.id; wx.showModal({ title: '删除消息', content: '确定删除这条定时消息吗？', success: res => { if (!res.confirm) return; wx.setStorageSync(KEY, (wx.getStorageSync(KEY) || []).filter(item => item.id !== id)); this.load() } }) },
  noop() {}
})

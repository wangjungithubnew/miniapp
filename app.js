// app.js
App({
  onLaunch() {
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }

    const cloudEnv = 'waqm-20261014-d2gl3j2hxff719013'
    if (!cloudEnv) {
      console.warn('未配置云开发环境 ID，PDF 云端合成不可用')
      return
    }
    wx.cloud.init({
      env: cloudEnv,
      traceUser: true
    })
  }
})

// 当前始终放行。未来接入激励视频时，仅在 check 中挂接解锁流程。
const policy = {
  enabled: false,
  requireRewardedVideo: false,
  isFeatureLocked() { return false },
  async check(action) {
    if (!this.enabled || !this.requireRewardedVideo) return true
    // TODO: 激励视频完成后 resolve true；用户跳过/失败则 resolve false。
    return true
  }
}

module.exports = policy

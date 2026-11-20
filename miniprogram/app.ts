App({
  globalData: {
    /** 真实环境可在此放登录态 / 用户 id */
    userId: '',
  },
  onLaunch() {
    // 真实环境：wx.login → 换取 session → 写入 globalData
  },
});

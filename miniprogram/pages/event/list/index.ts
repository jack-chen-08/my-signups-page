/**
 * 活动列表（路由占位页）。
 * 「我的报名」空状态的「去看看活动」跳到这里；正式活动列表由活动模块实现，
 * 本页只保证路由可跳转、可回退。
 */
Page({
  data: {
    tip: '活动列表由活动模块提供',
  },
  onLoad() {
    wx.setNavigationBarTitle({ title: '活动列表' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});

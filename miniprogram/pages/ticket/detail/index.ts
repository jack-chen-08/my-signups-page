/**
 * 电子票详情（路由占位页）。
 * 承接 pages/ticket/detail?event_id=xxx&signup_id=xxx，回显参数；
 * 正式电子票（二维码 / 核销码）由票务模块实现。
 */
import { parseQuery } from '../../../logic/nav';

Page({
  data: {
    eventId: '',
    signupId: '',
    tip: '电子票与核销码由票务模块提供',
  },
  onLoad(options: Record<string, string>) {
    const query = parseQuery(options || {});
    this.setData({ eventId: query.event_id || '', signupId: query.signup_id || '' });
    wx.setNavigationBarTitle({ title: '电子票' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});

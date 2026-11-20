/**
 * 填写问卷（路由占位页）。
 * 承接 pages/survey/fill?event_id=xxx，本页回显 event_id 以证明参数传递正确；
 * 正式问卷表单由问卷模块实现。
 */
import { parseQuery } from '../../../logic/nav';

Page({
  data: {
    eventId: '',
    tip: '问卷表单由问卷模块提供',
  },
  onLoad(options: Record<string, string>) {
    const query = parseQuery(options || {});
    this.setData({ eventId: query.event_id || '' });
    wx.setNavigationBarTitle({ title: '填写问卷' });
  },
  onBack() {
    wx.navigateBack({ delta: 1 });
  },
});

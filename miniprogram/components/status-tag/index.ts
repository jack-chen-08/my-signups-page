/**
 * 状态标签组件：只负责渲染，颜色映射由 logic/signups.ts 的 STATUS_META 决定，
 * 页面把 cls / solid 传进来，保证「逻辑单一来源」。
 */
Component({
  options: {
    addGlobalClass: true,
  },
  properties: {
    /** 标签文案：已报名 / 候补第 3 位 / 审核中 / 未通过 / 已取消 / 已签到 */
    text: { type: String, value: '' },
    /** 样式类：is-signed / is-waitlist / is-reviewing / is-rejected / is-cancelled / is-checked-in */
    cls: { type: String, value: 'is-signed' },
    /** 实心底（已签到：绿底白字） */
    solid: { type: Boolean, value: false },
  },
});

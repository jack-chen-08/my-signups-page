/**
 * 报名卡片：封面缩略图 + 标题 + 时间 + 空间名 + 状态标签 + 操作按钮。
 * 数据全部由父页面按 logic 计算好后传入，组件自身不做业务判断。
 */
Component({
  options: {
    addGlobalClass: true,
  },
  properties: {
    /** 报名记录（SignupRecord） */
    record: { type: Object, value: {} },
    /** 状态标签渲染描述 { text, cls, solid } */
    tag: { type: Object, value: {} },
    /** 按钮可见性 CardActions */
    actions: { type: Object, value: {} },
    /** 封面渐变样式 */
    coverStyle: { type: String, value: '' },
    /** 封面单字 */
    coverChar: { type: String, value: '活' },
    /** 审核说明是否展开 */
    expanded: { type: Boolean, value: false },
  },
  methods: {
    onAction(event: WechatMiniprogram.Event) {
      const type = event.currentTarget.dataset.type;
      this.triggerEvent('action', { type, id: this.data.record.id });
    },
    onToggleReview() {
      this.triggerEvent('action', { type: 'review', id: this.data.record.id });
    },
  },
});

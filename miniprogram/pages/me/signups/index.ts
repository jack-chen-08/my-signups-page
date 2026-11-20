import { fetchSignups, cancelSignup } from '../../../logic/api';
import {
  CANCEL_REASONS,
  CardModel,
  Counts,
  buildEmptyState,
  historyBadge,
  mergePage,
  splitByTab,
  toCardModel,
} from '../../../logic/signups';
import { eventListUrl, surveyFillUrl, ticketDetailUrl } from '../../../logic/nav';

const PAGE_SIZE = 6;

const EMPTY = buildEmptyState(1);

Page({
  data: {
    tab: 'active',
    views: { active: [] as CardModel[], history: [] as CardModel[] },
    visible: [] as CardModel[],
    counts: { pending_survey: 0, total: 0, active: 0, history: 0 } as Counts,
    badge: { show: false, text: '' },
    badgeProps: null as null | { count: number; showZero: boolean },
    pageMap: { active: 1, history: 1 },
    hasMore: false,
    hasMoreMap: { active: false, history: false },
    loading: true,
    loadingMore: false,
    error: '',
    empty: EMPTY,
    sheetVisible: false,
    sheetItems: CANCEL_REASONS.map((item) => ({ label: item.label })),
    cancelTarget: '',
    expandedId: '',
  },

  onLoad() {
    this.reloadAll();
  },

  onPullDownRefresh() {
    this.reloadAll().then(() => {
      wx.stopPullDownRefresh();
      wx.showToast({ title: '已刷新', icon: 'none' });
    });
  },

  onReachBottom() {
    this.loadMore();
  },

  /** 首屏 / 下拉刷新：两栏各取第 1 页 */
  async reloadAll() {
    this.setData({ loading: true, error: '' });
    try {
      const results = await Promise.all([
        fetchSignups({ tab: 'active', page: 1, page_size: PAGE_SIZE }),
        fetchSignups({ tab: 'history', page: 1, page_size: PAGE_SIZE }),
      ]);
      const activeRes = results[0];
      const historyRes = results[1];
      const counts = activeRes.counts;
      this.setData({
        views: {
          active: activeRes.list.map(toCardModel),
          history: historyRes.list.map(toCardModel),
        },
        pageMap: { active: 1, history: 1 },
        counts,
        badge: historyBadge(counts),
        badgeProps: counts.pending_survey > 0 ? { count: counts.pending_survey, showZero: false } : null,
        hasMoreMap: { active: activeRes.has_more, history: historyRes.has_more },
        loading: false,
      });
      this.refreshVisible();
    } catch (err) {
      const message = (err && err.message) || '加载失败，请稍后重试';
      this.setData({ loading: false, error: message });
      this.refreshVisible();
    }
  },

  /** 当前 Tab 的可见列表 + 空状态 */
  refreshVisible() {
    const tab = this.data.tab;
    const visible = this.data.views[tab] || [];
    const blocked = this.data.loading || !!this.data.error;
    this.setData({
      visible,
      hasMore: !!this.data.hasMoreMap[tab],
      empty: buildEmptyState(blocked ? 1 : visible.length),
    });
  },

  onTabChange(event: WechatMiniprogram.Event) {
    const value = (event.detail && event.detail.value) || 'active';
    if (value === this.data.tab) return;
    this.setData({ tab: value, expandedId: '' });
    this.refreshVisible();
  },

  loadMore() {
    if (this.data.loading || this.data.loadingMore || this.data.error) return;
    if (!this.data.hasMore) return;
    const tab = this.data.tab;
    const next = (this.data.pageMap[tab] || 1) + 1;
    this.setData({ loadingMore: true });
    fetchSignups({ tab, page: next, page_size: PAGE_SIZE })
      .then((res) => {
        const merged = mergePage(this.data.views[tab], res.list.map(toCardModel));
        this.setData({
          [`views.${tab}`]: merged,
          [`pageMap.${tab}`]: next,
          [`hasMoreMap.${tab}`]: res.has_more,
          loadingMore: false,
        });
        this.refreshVisible();
      })
      .catch(() => {
        this.setData({ loadingMore: false });
        wx.showToast({ title: '加载更多失败', icon: 'none' });
      });
  },

  findRecord(id: string): CardModel | undefined {
    const views = this.data.views;
    const pool = (views.active || []).concat(views.history || []);
    return pool.filter((item: CardModel) => item.id === id)[0];
  },

  /** 卡片按钮回调：电子票 / 填写问卷 / 取消报名 / 展开审核说明 */
  onCardAction(event: WechatMiniprogram.Event) {
    const detail = (event.detail || {}) as { type?: string; id?: string };
    const record = detail.id ? this.findRecord(detail.id) : undefined;
    switch (detail.type) {
      case 'ticket':
        if (record) wx.navigateTo({ url: ticketDetailUrl(record.event_id, record.id) });
        break;
      case 'survey':
        if (record) wx.navigateTo({ url: surveyFillUrl(record.event_id) });
        break;
      case 'survey_done':
        wx.showToast({ title: '问卷已提交', icon: 'none' });
        break;
      case 'cancel':
        this.setData({ sheetVisible: true, cancelTarget: detail.id || '' });
        break;
      case 'review':
        this.setData({ expandedId: this.data.expandedId === detail.id ? '' : detail.id || '' });
        break;
      default:
        break;
    }
  },

  onSheetClose() {
    this.setData({ sheetVisible: false, cancelTarget: '' });
  },

  /** 选中取消原因 → 调接口 */
  async onSheetSelected(event: WechatMiniprogram.Event) {
    const index = (event.detail && event.detail.index) || 0;
    const reason = CANCEL_REASONS[index];
    const target = this.data.cancelTarget;
    this.setData({ sheetVisible: false });
    if (!reason || !target) return;

    wx.showLoading({ title: '正在取消', mask: true });
    try {
      const res = await cancelSignup(target, reason.key);
      wx.hideLoading();
      if (!res.ok) {
        wx.showToast({ title: res.message, icon: 'none' });
        return;
      }
      this.setData({ cancelTarget: '' });
      wx.showToast({ title: `已取消（${reason.label}）`, icon: 'none' });
      this.applyCanceled(res.list);
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '取消报名失败，请稍后重试', icon: 'none' });
    }
  },

  /** 取消成功后重建两栏：进行中移除、历史置顶，并刷新角标 */
  applyCanceled(list: any[]) {
    const split = splitByTab(list);
    const counts = {
      pending_survey: list.filter((item: any) => item.survey_status === 'pending').length,
      total: list.length,
      active: split.active.length,
      history: split.history.length,
    };
    this.setData({
      views: {
        active: split.active.slice(0, PAGE_SIZE).map(toCardModel),
        history: split.history.slice(0, PAGE_SIZE).map(toCardModel),
      },
      pageMap: { active: 1, history: 1 },
      hasMoreMap: { active: split.active.length > PAGE_SIZE, history: split.history.length > PAGE_SIZE },
      counts,
      badge: historyBadge(counts),
      badgeProps: counts.pending_survey > 0 ? { count: counts.pending_survey, showZero: false } : null,
    });
    this.refreshVisible();
  },

  onGoEvents() {
    wx.navigateTo({ url: eventListUrl() });
  },

  onRetry() {
    this.reloadAll();
  },
});

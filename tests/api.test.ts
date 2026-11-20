import {
  cancelSignup,
  ENDPOINTS,
  fetchSignups,
  resetMockStore,
  setMockFailure,
  snapshotStore,
} from '../miniprogram/logic/api';
import { tabOf } from '../miniprogram/logic/signups';

describe('mock 接口：GET /api/mini/me/signups', () => {
  beforeEach(() => resetMockStore());

  it('返回 list / counts / page / page_size / has_more 结构', async () => {
    const res = await fetchSignups({ tab: 'active', page: 1, page_size: 6, delay: 0 });
    expect(res.list).toHaveLength(6);
    expect(res.page).toBe(1);
    expect(res.page_size).toBe(6);
    expect(res.has_more).toBe(true);
    expect(res.counts.pending_survey).toBe(3);
    res.list.forEach((item) => expect(tabOf(item)).toBe('active'));
  });

  it('历史栏分页：第 1 页 6 条，最后第 3 页只有 0~6 条且 has_more=false', async () => {
    const first = await fetchSignups({ tab: 'history', page: 1, page_size: 6, delay: 0 });
    expect(first.list).toHaveLength(6);
    expect(first.has_more).toBe(true);

    const third = await fetchSignups({ tab: 'history', page: 3, page_size: 6, delay: 0 });
    expect(third.has_more).toBe(false);
    third.list.forEach((item) => expect(tabOf(item)).toBe('history'));
  });

  it('tab=all 返回全部记录', async () => {
    const res = await fetchSignups({ tab: 'all', page: 1, page_size: 50, delay: 0 });
    expect(res.list.length).toBe(snapshotStore().length);
  });

  it('列表接口失败时抛错（页面展示重试态）', async () => {
    setMockFailure('list');
    await expect(fetchSignups({ delay: 0 })).rejects.toThrow('网络异常，请稍后重试');
  });

  it('接口地址常量与对接文档一致', () => {
    expect(ENDPOINTS.signups).toBe('GET /api/mini/me/signups');
    expect(ENDPOINTS.cancel).toBe('POST /api/mini/me/signups/{id}/cancel');
  });
});

describe('mock 接口：POST /api/mini/me/signups/{id}/cancel', () => {
  beforeEach(() => resetMockStore());

  it('取消成功：返回 ok，并从进行中移入历史', async () => {
    const res = await cancelSignup('sg_2001', 'time_conflict', { delay: 0 });
    expect(res.ok).toBe(true);
    expect(res.message).toBe('已取消报名');
    expect(res.active.some((item) => item.id === 'sg_2001')).toBe(false);

    const moved = res.history.filter((item) => item.id === 'sg_2001')[0];
    expect(moved).toBeDefined();
    expect(moved.status).toBe('cancelled');
    expect(moved.cancel_reason).toBe('时间冲突');
    // 取消后历史首页第一条就是刚取消的
    expect(res.history[0].id).toBe('sg_2001');
  });

  it('取消后再拉列表：进行中不含该条，历史含该条（状态持久化）', async () => {
    await cancelSignup('sg_2002', 'not_interested', { delay: 0 });
    const active = await fetchSignups({ tab: 'active', page: 1, page_size: 20, delay: 0 });
    const history = await fetchSignups({ tab: 'history', page: 1, page_size: 20, delay: 0 });

    expect(active.list.some((item) => item.id === 'sg_2002')).toBe(false);
    const moved = history.list.filter((item) => item.id === 'sg_2002')[0];
    expect(moved.status).toBe('cancelled');
    expect(moved.cancel_reason).toBe('不再感兴趣');
  });

  it('取消接口失败：返回 ok=false + 中文提示，且列表不移动', async () => {
    setMockFailure('cancel');
    const before = snapshotStore();
    const res = await cancelSignup('sg_2001', 'other', { delay: 0 });

    expect(res.ok).toBe(false);
    expect(res.message).toBe('取消报名失败，请稍后重试');
    expect(res.active.some((item) => item.id === 'sg_2001')).toBe(true);
    expect(res.history.some((item) => item.id === 'sg_2001')).toBe(false);
    expect(snapshotStore()).toEqual(before);
  });

  it('取消不存在的记录：ok=false，提示「未找到这条报名记录」', async () => {
    const res = await cancelSignup('sg_9999', 'other', { delay: 0 });
    expect(res.ok).toBe(false);
    expect(res.message).toBe('未找到这条报名记录');
  });

  it('取消后待填问卷角标数不变（问卷不因取消而消失）', async () => {
    const before = await fetchSignups({ tab: 'active', page: 1, delay: 0 });
    const res = await cancelSignup('sg_2003', 'other', { delay: 0 });
    expect(res.counts.pending_survey).toBe(before.counts.pending_survey);
  });
});

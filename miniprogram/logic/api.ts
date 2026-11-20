/**
 * 数据访问层（mock 实现，后续替换为真实请求）。
 *
 * 真实对接点：
 *   GET  /api/mini/me/signups?page=1&page_size=6&tab=active
 *   POST /api/mini/me/signups/{id}/cancel   body: { reason }
 *
 * 说明：此处不引入任何第三方 SDK，也不向境外发送数据；
 * 真实环境把 request() 换成 wx.request 即可，函数签名保持不变。
 */
import { MOCK_SIGNUPS } from '../mock/signups';
import {
  SignupRecord,
  SignupsResponse,
  Counts,
  computeCounts,
  cancelAndSplit,
  paginate,
  splitByTab,
} from './signups';

/** 接口地址常量（对接文档 / README 引用同一份） */
export const ENDPOINTS = {
  signups: 'GET /api/mini/me/signups',
  cancel: 'POST /api/mini/me/signups/{id}/cancel',
};

export type MockFailure = 'none' | 'list' | 'cancel';

export interface FetchSignupsOptions {
  page?: number;
  page_size?: number;
  /** active=进行中 / history=历史 / all=全部 */
  tab?: 'active' | 'history' | 'all';
  /** mock 延时，测试传 0 */
  delay?: number;
}

export interface CancelResponse {
  ok: boolean;
  message: string;
  list: SignupRecord[];
  active: SignupRecord[];
  history: SignupRecord[];
  counts: Counts;
  record?: SignupRecord;
}

let store: SignupRecord[] = cloneSeed();
let failure: MockFailure = 'none';

function cloneSeed(): SignupRecord[] {
  return MOCK_SIGNUPS.map((item) => ({ ...item }));
}

function sleep(ms: number): Promise<void> {
  if (!ms || ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 测试用：把 mock 存储与故障开关重置 */
export function resetMockStore(): void {
  store = cloneSeed();
  failure = 'none';
}

/** 测试用：注入失败场景（列表失败 / 取消失败） */
export function setMockFailure(mode: MockFailure): void {
  failure = mode;
}

/** 只读快照（供测试或调试） */
export function snapshotStore(): SignupRecord[] {
  return store.map((item) => ({ ...item }));
}

/**
 * 拉取我的报名列表。
 * 返回结构：{ list, counts, page, page_size, has_more }
 */
export async function fetchSignups(options: FetchSignupsOptions = {}): Promise<SignupsResponse> {
  const page = options.page || 1;
  const pageSize = options.page_size || 6;
  const tab = options.tab || 'active';
  await sleep(options.delay === undefined ? 180 : options.delay);

  if (failure === 'list') {
    const err: any = new Error('网络异常，请稍后重试');
    err.code = 'MOCK_NETWORK_ERROR';
    throw err;
  }

  const split = splitByTab(store);
  const scoped = tab === 'all' ? store : tab === 'history' ? split.history : split.active;
  const result = paginate(scoped, page, pageSize);

  return {
    list: result.items,
    counts: computeCounts(store),
    page: result.page,
    page_size: result.page_size,
    has_more: result.has_more,
  };
}

/**
 * 取消报名。
 * 成功：记录变为「已取消」，从进行中移入历史。
 * 失败：返回 ok=false + 中文提示，列表不变。
 */
export async function cancelSignup(
  id: string,
  reason: string,
  options: { delay?: number; now?: string } = {},
): Promise<CancelResponse> {
  await sleep(options.delay === undefined ? 220 : options.delay);
  const base = {
    list: store,
    active: splitByTab(store).active,
    history: splitByTab(store).history,
    counts: computeCounts(store),
  };

  if (failure === 'cancel') {
    return { ...base, ok: false, message: '取消报名失败，请稍后重试' };
  }

  const result = cancelAndSplit(store, id, reason, options.now || '2026-11-21 09:41');
  if (!result.moved) {
    return { ...base, ok: false, message: '未找到这条报名记录' };
  }
  store = result.list;
  return {
    ok: true,
    message: '已取消报名',
    list: store,
    active: result.active,
    history: result.history,
    counts: computeCounts(store),
    record: result.record,
  };
}

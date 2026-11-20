/**
 * 路由 URL 构造（纯函数，不依赖 wx）。
 * 页面里统一用这里生成 path，单测直接断言返回值。
 */

export const ROUTES = {
  /** 我的报名（本页） */
  mySignups: 'pages/me/signups/index',
  /** 电子票详情 */
  ticketDetail: 'pages/ticket/detail',
  /** 填写问卷 */
  surveyFill: 'pages/survey/fill',
  /** 活动列表 */
  eventList: 'pages/event/list',
};

/**
 * 拼 query：按 key 字典序输出，跳过 undefined / null / 空串。
 * 例：buildUrl('pages/a/b', { event_id: 'evt_1' }) → 'pages/a/b?event_id=evt_1'
 */
export function buildUrl(path: string, params: Record<string, string | number | undefined | null> = {}): string {
  const keys = Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== '')
    .sort();
  if (!keys.length) return path;
  const query = keys
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
  return `${path}?${query}`;
}

/** 填写问卷：pages/survey/fill?event_id=xxx */
export function surveyFillUrl(eventId: string): string {
  return buildUrl(ROUTES.surveyFill, { event_id: eventId });
}

/** 电子票详情：pages/ticket/detail?event_id=xxx&signup_id=xxx */
export function ticketDetailUrl(eventId: string, signupId?: string): string {
  return buildUrl(ROUTES.ticketDetail, { event_id: eventId, signup_id: signupId });
}

/** 活动列表：pages/event/list */
export function eventListUrl(): string {
  return buildUrl(ROUTES.eventList);
}

/** 解析 query（用于占位页回显参数） */
export function parseQuery(query: Record<string, string | undefined> = {}): Record<string, string> {
  const out: Record<string, string> = {};
  Object.keys(query || {}).forEach((key) => {
    const value = query[key];
    out[key] = value === undefined || value === null ? '' : decodeURIComponent(String(value));
  });
  return out;
}

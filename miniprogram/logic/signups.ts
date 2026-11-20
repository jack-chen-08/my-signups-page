/**
 * 我的报名页 —— 纯业务逻辑（不依赖 wx / 小程序运行时，可直接单元测试）
 *
 * 职责：状态标签映射、操作按钮可见性、Tab 分组、取消后列表迁移、
 *      待填问卷角标计数、分页合并、空状态描述。
 */

/** 报名状态（对应接口 status 字段） */
export type SignupStatus =
  | 'signed' // 已报名
  | 'waitlist' // 候补
  | 'reviewing' // 审核中
  | 'rejected' // 未通过
  | 'cancelled' // 已取消
  | 'checked_in'; // 已签到

/** 问卷状态 */
export type SurveyStatus = 'none' | 'pending' | 'submitted';

/** 一条报名记录（字段即 GET /api/mini/me/signups 的 list 元素） */
export interface SignupRecord {
  id: string;
  event_id: string;
  event_title: string;
  /** 活动时间，已由服务端格式化，如「12月06日 周六 14:00-16:30」 */
  time_text: string;
  /** 空间名，如「拾光共创空间 3F·梧桐厅」 */
  space_name: string;
  status: SignupStatus;
  /** 候补排名，仅 status=waitlist 有效 */
  waitlist_no?: number;
  /** 电子票是否可查看 */
  ticket_available: boolean;
  /** 是否允许取消报名 */
  can_cancel: boolean;
  /** 审核说明，仅 status=rejected 有效 */
  review_note?: string;
  survey_status: SurveyStatus;
  /** 问卷截止时间文案，仅 survey_status=pending 有效 */
  survey_deadline?: string;
  /** 报名时间，用于倒序排列 */
  created_at: string;
  /** 最近一次状态变更时间（取消报名后刷新排序），缺省用 created_at */
  updated_at?: string;
  /** 取消原因，取消成功后写入 */
  cancel_reason?: string;
  /** 封面图地址；mock 数据留空，前端用渐变占位 */
  cover_url?: string;
}

/** 状态标签样式类（与 status-tag 组件 / wxss / preview 一一对应） */
export type StatusClass =
  | 'is-signed'
  | 'is-waitlist'
  | 'is-reviewing'
  | 'is-rejected'
  | 'is-cancelled'
  | 'is-checked-in';

export interface StatusMeta {
  /** 中文标签文案 */
  label: string;
  /** 样式类名 */
  cls: StatusClass;
  /** 文字色 */
  color: string;
  /** 底色；is-checked-in 为实心底 */
  bg: string;
  /** 是否实心（绿底白字） */
  solid: boolean;
}

/** 6 种状态 → 文案 / 颜色 的唯一映射表 */
export const STATUS_META: Record<SignupStatus, StatusMeta> = {
  signed: { label: '已报名', cls: 'is-signed', color: '#2ba471', bg: '#e3f9e9', solid: false },
  waitlist: { label: '候补', cls: 'is-waitlist', color: '#e37318', bg: '#fff1e9', solid: false },
  reviewing: { label: '审核中', cls: 'is-reviewing', color: '#0052d9', bg: '#e3f0ff', solid: false },
  rejected: { label: '未通过', cls: 'is-rejected', color: '#8b8b8b', bg: '#eeeeee', solid: false },
  cancelled: { label: '已取消', cls: 'is-cancelled', color: '#8b8b8b', bg: '#eeeeee', solid: false },
  checked_in: { label: '已签到', cls: 'is-checked-in', color: '#ffffff', bg: '#2ba471', solid: true },
};

/** 状态标签的渲染描述 */
export interface StatusTag {
  text: string;
  cls: StatusClass;
  solid: boolean;
}

/**
 * 计算状态标签：候补状态需要拼上排名 →「候补第 3 位」。
 */
export function statusTag(record: SignupRecord): StatusTag {
  const meta = STATUS_META[record.status];
  if (!meta) {
    // 兜底：未知状态按未通过样式展示，避免页面白块
    const fallback = STATUS_META.rejected;
    return { text: '未知状态', cls: fallback.cls, solid: fallback.solid };
  }
  if (record.status === 'waitlist') {
    const no = typeof record.waitlist_no === 'number' && record.waitlist_no > 0 ? record.waitlist_no : 1;
    return { text: `候补第 ${no} 位`, cls: meta.cls, solid: meta.solid };
  }
  return { text: meta.label, cls: meta.cls, solid: meta.solid };
}

/** 卡片底部按钮可见性 */
export interface CardActions {
  /** 「电子票」 */
  showTicket: boolean;
  /** 「取消报名」 */
  showCancel: boolean;
  /** 「填写问卷」 */
  showSurveyFill: boolean;
  /** 「已提交问卷」 */
  showSurveyDone: boolean;
  /** 是否可展开审核说明 */
  canExpandReview: boolean;
}

/**
 * 按字段推导按钮可见性。
 * - ticket_available → 电子票
 * - can_cancel → 取消报名（只认字段，不猜状态）
 * - survey_status=pending → 填写问卷；submitted → 已提交问卷
 * - rejected + review_note → 可展开审核说明
 */
export function cardActions(record: SignupRecord): CardActions {
  return {
    showTicket: record.ticket_available === true,
    showCancel: record.can_cancel === true,
    showSurveyFill: record.survey_status === 'pending',
    showSurveyDone: record.survey_status === 'submitted',
    canExpandReview: record.status === 'rejected' && !!record.review_note,
  };
}

/** 进行中 Tab 容纳的状态；其余归入历史 */
const ACTIVE_STATUSES: SignupStatus[] = ['signed', 'waitlist', 'reviewing'];

export type TabKey = 'active' | 'history';

export function tabOf(record: SignupRecord): TabKey {
  return ACTIVE_STATUSES.indexOf(record.status) >= 0 ? 'active' : 'history';
}

/** 排序时间：有状态变更时间用变更时间，否则用报名时间 */
export function sortTime(record: SignupRecord): string {
  return record.updated_at || record.created_at;
}

/** 按时间倒序（同时间保持原顺序，排序稳定） */
export function sortByCreatedDesc(list: SignupRecord[]): SignupRecord[] {
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const left = sortTime(a.item);
      const right = sortTime(b.item);
      if (left === right) return a.index - b.index;
      return left < right ? 1 : -1;
    })
    .map((entry) => entry.item);
}

export interface SplitResult {
  active: SignupRecord[];
  history: SignupRecord[];
}

/** 拆分为「进行中 / 历史」两栏 */
export function splitByTab(list: SignupRecord[]): SplitResult {
  const sorted = sortByCreatedDesc(list);
  const result: SplitResult = { active: [], history: [] };
  sorted.forEach((record) => {
    result[tabOf(record)].push(record);
  });
  return result;
}

export interface Counts {
  pending_survey: number;
  total: number;
  active: number;
  history: number;
}

/** 统计：待填问卷数等（对应接口 counts 字段） */
export function computeCounts(list: SignupRecord[]): Counts {
  const split = splitByTab(list);
  return {
    pending_survey: list.filter((item) => item.survey_status === 'pending').length,
    total: list.length,
    active: split.active.length,
    history: split.history.length,
  };
}

export interface BadgeState {
  show: boolean;
  text: string;
}

/** 「历史」Tab 标题旁角标：仅有待填问卷时显示，且数字等于待填数 */
export function historyBadge(counts: Counts): BadgeState {
  if (!counts || counts.pending_survey <= 0) return { show: false, text: '' };
  return { show: true, text: String(counts.pending_survey) };
}

/** 取消报名可选原因（t-action-sheet 选项） */
export const CANCEL_REASONS = [
  { key: 'time_conflict', label: '时间冲突' },
  { key: 'not_interested', label: '不再感兴趣' },
  { key: 'other', label: '其他' },
] as const;

export type CancelReasonKey = typeof CANCEL_REASONS[number]['key'];

export function reasonLabel(key: string): string {
  const hit = CANCEL_REASONS.filter((item) => item.key === key)[0];
  return hit ? hit.label : '其他';
}

/** 取消成功后把记录改写成「已取消」：清掉电子票与取消入口，写入原因。 */
export function applyCancel(record: SignupRecord, reason: string, now: string): SignupRecord {
  return {
    ...record,
    status: 'cancelled',
    can_cancel: false,
    ticket_available: false,
    cancel_reason: reasonLabel(reason),
    updated_at: now || record.updated_at || record.created_at,
  };
}

export interface CancelResult {
  list: SignupRecord[];
  active: SignupRecord[];
  history: SignupRecord[];
  moved: boolean;
  record?: SignupRecord;
}

/**
 * 取消报名成功后的列表迁移（纯函数）：
 * 目标记录变为 cancelled → 自然落入历史栏；不存在则原样返回。
 */
export function cancelAndSplit(list: SignupRecord[], id: string, reason: string, now = ''): CancelResult {
  let moved = false;
  let target: SignupRecord | undefined;
  const next = list.map((item) => {
    if (item.id !== id) return item;
    moved = true;
    target = applyCancel(item, reason, now);
    return target;
  });
  const split = splitByTab(next);
  return { list: next, active: split.active, history: split.history, moved, record: target };
}

export interface PageResult {
  items: SignupRecord[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

/** 客户端分页（mock 用；真实环境由接口返回同样结构） */
export function paginate(list: SignupRecord[], page: number, pageSize = 6): PageResult {
  const safePage = page < 1 ? 1 : page;
  const start = (safePage - 1) * pageSize;
  const items = list.slice(start, start + pageSize);
  return {
    items,
    page: safePage,
    page_size: pageSize,
    total: list.length,
    has_more: start + items.length < list.length,
  };
}

/** 触底加载：按 id 去重合并，避免重复请求造成卡片重复 */
export function mergePage(prev: SignupRecord[], next: SignupRecord[]): SignupRecord[] {
  const seen: Record<string, boolean> = {};
  const merged: SignupRecord[] = [];
  prev.concat(next).forEach((item) => {
    if (seen[item.id]) return;
    seen[item.id] = true;
    merged.push(item);
  });
  return merged;
}

export interface EmptyState {
  show: boolean;
  text: string;
  desc: string;
  action_text: string;
  action_url: string;
}

/** 空状态描述（列表为空时展示） */
export function buildEmptyState(visibleCount: number): EmptyState {
  return {
    show: visibleCount === 0,
    text: '还没有报名活动',
    desc: '去活动列表看看，报名后会出现在这里',
    action_text: '去看看活动',
    action_url: 'pages/event/list',
  };
}

/** 封面占位渐变（mock 无真实图片时使用，接入后改用 cover_url） */
const COVER_PALETTE = [
  ['#7fb2ff', '#0052d9'],
  ['#ffc48a', '#e37318'],
  ['#8fd9b6', '#2ba471'],
  ['#b6a6ff', '#6b4ee6'],
  ['#ffa8a8', '#d54941'],
  ['#9ad7e8', '#1a7f9e'],
];

export function coverStyle(record: SignupRecord): string {
  if (record.cover_url) {
    return `background-image:url('${record.cover_url}');background-size:cover;background-position:center`;
  }
  let hash = 0;
  const seed = record.event_id || record.id || '';
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  const pair = COVER_PALETTE[hash % COVER_PALETTE.length];
  return `background-image:linear-gradient(135deg, ${pair[0]} 0%, ${pair[1]} 100%)`;
}

/** 封面上的单字水印 */
export function coverChar(record: SignupRecord): string {
  const title = (record.event_title || '活').replace(/^[「《\s]+/, '');
  return title.slice(0, 1);
}

/** 接口响应结构（GET /api/mini/me/signups） */
export interface SignupsResponse {
  list: SignupRecord[];
  counts: Counts;
  page: number;
  page_size: number;
  has_more: boolean;
}

/** 卡片视图模型：页面直接 setData 这个结构，wxml 里零计算 */
export interface CardModel extends SignupRecord {
  tag: StatusTag;
  actions: CardActions;
  coverStyle: string;
  coverChar: string;
}

export function toCardModel(record: SignupRecord): CardModel {
  return {
    ...record,
    tag: statusTag(record),
    actions: cardActions(record),
    coverStyle: coverStyle(record),
    coverChar: coverChar(record),
  };
}

/** 兼容服务端可能少字段的兜底归一化 */
export function normalizeResponse(raw: any): SignupsResponse {
  const list: SignupRecord[] = Array.isArray(raw && raw.list) ? raw.list : [];
  const counts = raw && raw.counts ? { ...computeCounts(list), ...raw.counts } : computeCounts(list);
  return {
    list,
    counts,
    page: (raw && raw.page) || 1,
    page_size: (raw && raw.page_size) || list.length,
    has_more: !!(raw && raw.has_more),
  };
}

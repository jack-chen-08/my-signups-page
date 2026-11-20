import {
  CANCEL_REASONS,
  CardModel,
  SignupRecord,
  STATUS_META,
  applyCancel,
  buildEmptyState,
  cancelAndSplit,
  cardActions,
  computeCounts,
  coverStyle,
  historyBadge,
  mergePage,
  paginate,
  reasonLabel,
  sortByCreatedDesc,
  splitByTab,
  statusTag,
  toCardModel,
} from '../miniprogram/logic/signups';
import { MOCK_SIGNUPS } from '../miniprogram/mock/signups';

/** 构造一条最小可用报名记录 */
function make(overrides: Partial<SignupRecord> = {}): SignupRecord {
  return {
    id: 'sg_t',
    event_id: 'evt_t',
    event_title: '测试活动',
    time_text: '12月01日 周六 10:00-12:00',
    space_name: '测试空间 1F',
    status: 'signed',
    ticket_available: false,
    can_cancel: true,
    survey_status: 'none',
    created_at: '2026-11-01 10:00',
    ...overrides,
  };
}

describe('状态标签：6 种状态 → 文案 / 颜色类名', () => {
  const cases: Array<[SignupRecord['status'], string, string, boolean]> = [
    ['signed', '已报名', 'is-signed', false],
    ['reviewing', '审核中', 'is-reviewing', false],
    ['rejected', '未通过', 'is-rejected', false],
    ['cancelled', '已取消', 'is-cancelled', false],
    ['checked_in', '已签到', 'is-checked-in', true],
  ];

  test.each(cases)('status=%s → %s / %s', (status, text, cls, solid) => {
    const tag = statusTag(make({ status }));
    expect(tag.text).toBe(text);
    expect(tag.cls).toBe(cls);
    expect(tag.solid).toBe(solid);
  });

  it('候补状态拼上排名：候补第 3 位，且为橙色类名', () => {
    const tag = statusTag(make({ status: 'waitlist', waitlist_no: 3 }));
    expect(tag.text).toBe('候补第 3 位');
    expect(tag.cls).toBe('is-waitlist');
    expect(tag.solid).toBe(false);
  });

  it('候补缺排名时兜底为「候补第 1 位」，不出现 undefined', () => {
    const tag = statusTag(make({ status: 'waitlist', waitlist_no: undefined }));
    expect(tag.text).toBe('候补第 1 位');
  });

  it('颜色表：已报名绿、候补橙、审核中蓝、未通过灰、已取消灰、已签到绿底白字', () => {
    expect(STATUS_META.signed.color).toBe('#2ba471');
    expect(STATUS_META.waitlist.color).toBe('#e37318');
    expect(STATUS_META.reviewing.color).toBe('#0052d9');
    expect(STATUS_META.rejected.color).toBe('#8b8b8b');
    expect(STATUS_META.cancelled.color).toBe('#8b8b8b');
    expect(STATUS_META.checked_in.bg).toBe('#2ba471');
    expect(STATUS_META.checked_in.color).toBe('#ffffff');
    expect(STATUS_META.checked_in.solid).toBe(true);
  });

  it('未知状态不抛错（兜底为灰）', () => {
    const tag = statusTag(make({ status: 'unknown' as any }));
    expect(tag.text).toBe('未知状态');
    expect(tag.cls).toBe('is-rejected');
  });
});

describe('操作按钮可见性', () => {
  it('can_cancel=false 不显示「取消报名」', () => {
    expect(cardActions(make({ can_cancel: false })).showCancel).toBe(false);
  });

  it('can_cancel=true 显示「取消报名」', () => {
    expect(cardActions(make({ can_cancel: true })).showCancel).toBe(true);
  });

  it('ticket_available 控制「电子票」显隐', () => {
    expect(cardActions(make({ ticket_available: true })).showTicket).toBe(true);
    expect(cardActions(make({ ticket_available: false })).showTicket).toBe(false);
  });

  it('survey=pending 显示「填写问卷」，不显示「已提交问卷」', () => {
    const actions = cardActions(make({ survey_status: 'pending' }));
    expect(actions.showSurveyFill).toBe(true);
    expect(actions.showSurveyDone).toBe(false);
  });

  it('survey=submitted 只显示「已提交问卷」', () => {
    const actions = cardActions(make({ survey_status: 'submitted' }));
    expect(actions.showSurveyFill).toBe(false);
    expect(actions.showSurveyDone).toBe(true);
  });

  it('已取消的报名不再显示任何操作按钮', () => {
    const actions = cardActions(
      make({ status: 'cancelled', can_cancel: false, ticket_available: false, survey_status: 'none' }),
    );
    expect(actions.showTicket).toBe(false);
    expect(actions.showCancel).toBe(false);
    expect(actions.showSurveyFill).toBe(false);
    expect(actions.showSurveyDone).toBe(false);
  });

  it('rejected 且有 review_note → 可展开审核说明', () => {
    expect(cardActions(make({ status: 'rejected', review_note: '名额已满' })).canExpandReview).toBe(true);
    expect(cardActions(make({ status: 'rejected', review_note: '' })).canExpandReview).toBe(false);
    expect(cardActions(make({ status: 'signed', review_note: '不会展示' })).canExpandReview).toBe(false);
  });
});

describe('Tab 分组', () => {
  it('进行中只含 signed / waitlist / reviewing，其余进历史', () => {
    const list = [
      make({ id: 'a', status: 'signed' }),
      make({ id: 'b', status: 'waitlist', waitlist_no: 2 }),
      make({ id: 'c', status: 'reviewing' }),
      make({ id: 'd', status: 'rejected' }),
      make({ id: 'e', status: 'cancelled' }),
      make({ id: 'f', status: 'checked_in' }),
    ];
    const split = splitByTab(list);
    expect(split.active.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(split.history.map((item) => item.id)).toEqual(['d', 'e', 'f']);
  });

  it('按时间倒序，新报名在前', () => {
    const list = [
      make({ id: 'old', created_at: '2026-10-01 09:00' }),
      make({ id: 'new', created_at: '2026-11-20 09:00' }),
      make({ id: 'mid', created_at: '2026-11-01 09:00' }),
    ];
    expect(sortByCreatedDesc(list).map((item) => item.id)).toEqual(['new', 'mid', 'old']);
  });
});

describe('取消报名后的列表迁移', () => {
  it('取消成功后：从进行中移除、出现在历史、状态为已取消', () => {
    const list = [
      make({ id: 'keep', status: 'signed' }),
      make({ id: 'target', status: 'signed', can_cancel: true, ticket_available: true }),
    ];
    const result = cancelAndSplit(list, 'target', 'time_conflict', '2026-11-21 09:41');

    expect(result.moved).toBe(true);
    expect(result.active.map((item) => item.id)).toEqual(['keep']);
    expect(result.history.map((item) => item.id)).toEqual(['target']);

    const moved = result.history[0];
    expect(moved.status).toBe('cancelled');
    expect(moved.can_cancel).toBe(false);
    expect(moved.ticket_available).toBe(false);
    expect(moved.cancel_reason).toBe('时间冲突');
    expect(moved.updated_at).toBe('2026-11-21 09:41');
    // 原数组不被修改（纯函数）
    expect(list[1].status).toBe('signed');
  });

  it('取消后进入历史首位（按状态变更时间排序）', () => {
    const list = [
      make({ id: 'h1', status: 'checked_in', created_at: '2026-10-10 10:00' }),
      make({ id: 'h2', status: 'checked_in', created_at: '2026-09-10 10:00' }),
      make({ id: 'target', status: 'signed', created_at: '2026-08-01 10:00' }),
    ];
    const result = cancelAndSplit(list, 'target', 'other', '2026-11-21 09:41');
    expect(result.history[0].id).toBe('target');
  });

  it('记录不存在时不移动、列表长度不变', () => {
    const list = [make({ id: 'a' })];
    const result = cancelAndSplit(list, 'not-exist', 'other', '2026-11-21 09:41');
    expect(result.moved).toBe(false);
    expect(result.active).toHaveLength(1);
    expect(result.history).toHaveLength(0);
  });

  it('三种取消原因都有中文文案', () => {
    expect(CANCEL_REASONS.map((item) => item.label)).toEqual(['时间冲突', '不再感兴趣', '其他']);
    expect(reasonLabel('not_interested')).toBe('不再感兴趣');
    expect(reasonLabel('unknown-key')).toBe('其他');
  });

  it('applyCancel 不改 created_at，只写 updated_at', () => {
    const record = make({ created_at: '2026-11-01 10:00' });
    const next = applyCancel(record, 'other', '2026-11-21 09:41');
    expect(next.created_at).toBe('2026-11-01 10:00');
    expect(next.updated_at).toBe('2026-11-21 09:41');
  });
});

describe('待填问卷角标计数', () => {
  it('有待填问卷时显示，数字等于待填数', () => {
    const list = [
      make({ id: '1', status: 'checked_in', survey_status: 'pending' }),
      make({ id: '2', status: 'checked_in', survey_status: 'pending' }),
      make({ id: '3', status: 'checked_in', survey_status: 'submitted' }),
    ];
    const counts = computeCounts(list);
    expect(counts.pending_survey).toBe(2);
    const badge = historyBadge(counts);
    expect(badge.show).toBe(true);
    expect(badge.text).toBe('2');
  });

  it('没有待填问卷时隐藏角标（不显示 0）', () => {
    const counts = computeCounts([make({ survey_status: 'submitted' }), make({ survey_status: 'none' })]);
    expect(counts.pending_survey).toBe(0);
    expect(historyBadge(counts)).toEqual({ show: false, text: '' });
  });

  it('computeCounts 同时给出两栏条数', () => {
    const list = [
      make({ id: '1', status: 'signed' }),
      make({ id: '2', status: 'reviewing' }),
      make({ id: '3', status: 'checked_in' }),
    ];
    const counts = computeCounts(list);
    expect(counts).toMatchObject({ total: 3, active: 2, history: 1 });
  });
});

describe('分页与合并', () => {
  it('paginate 按页切片并给出 has_more', () => {
    const list = Array.from({ length: 15 }, (_, i) => make({ id: `p${i}` }));
    const first = paginate(list, 1, 6);
    expect(first.items).toHaveLength(6);
    expect(first.has_more).toBe(true);
    expect(first.page).toBe(1);

    const last = paginate(list, 3, 6);
    expect(last.items).toHaveLength(3);
    expect(last.has_more).toBe(false);
  });

  it('mergePage 按 id 去重合并，不产生重复卡片', () => {
    const prev = [make({ id: 'a' }), make({ id: 'b' })];
    const next = [make({ id: 'b' }), make({ id: 'c' })];
    const merged = mergePage(prev, next);
    expect(merged.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('mergePage 对空页安全', () => {
    expect(mergePage([make({ id: 'a' })], []).map((item) => item.id)).toEqual(['a']);
    expect(mergePage([], [make({ id: 'x' })]).map((item) => item.id)).toEqual(['x']);
  });
});

describe('空状态', () => {
  it('列表为空时展示空状态与「去看看活动」', () => {
    const empty = buildEmptyState(0);
    expect(empty.show).toBe(true);
    expect(empty.text).toBe('还没有报名活动');
    expect(empty.action_text).toBe('去看看活动');
    expect(empty.action_url).toBe('pages/event/list');
  });

  it('有数据时不展示空状态', () => {
    expect(buildEmptyState(3).show).toBe(false);
  });
});

describe('卡片视图模型', () => {
  it('toCardModel 一次算好 tag / actions / 封面占位', () => {
    const model: CardModel = toCardModel(make({ status: 'waitlist', waitlist_no: 5, ticket_available: true }));
    expect(model.tag.text).toBe('候补第 5 位');
    expect(model.actions.showTicket).toBe(true);
    expect(model.coverStyle).toContain('linear-gradient');
    expect(model.coverChar).toBe('测');
  });

  it('有 cover_url 时改用真实图片背景', () => {
    const model = toCardModel(make({ cover_url: 'https://cdn.example.com/a.jpg' }));
    expect(model.coverStyle).toContain("url('https://cdn.example.com/a.jpg')");
  });

  it('coverStyle 对同一活动稳定（不会每次渲染换色）', () => {
    const a = coverStyle(make({ event_id: 'evt_1001' }));
    const b = coverStyle(make({ event_id: 'evt_1001' }));
    expect(a).toBe(b);
  });
});

describe('mock 数据完整性', () => {
  it('至少 16 条记录', () => {
    expect(MOCK_SIGNUPS.length).toBeGreaterThanOrEqual(16);
  });

  it('覆盖全部 6 种状态', () => {
    const statuses = MOCK_SIGNUPS.map((item) => item.status);
    ['signed', 'waitlist', 'reviewing', 'rejected', 'cancelled', 'checked_in'].forEach((status) => {
      expect(statuses).toContain(status);
    });
  });

  it('覆盖 can_cancel 真假、ticket_available 真假、survey 三态', () => {
    expect(MOCK_SIGNUPS.some((item) => item.can_cancel)).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => !item.can_cancel)).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => item.ticket_available)).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => !item.ticket_available)).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => item.survey_status === 'pending')).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => item.survey_status === 'submitted')).toBe(true);
    expect(MOCK_SIGNUPS.some((item) => item.survey_status === 'none')).toBe(true);
  });

  it('每条记录字段完整，且不含手机号 / 邮箱等真实个人信息', () => {
    const blob = JSON.stringify(MOCK_SIGNUPS);
    expect(blob).not.toMatch(/1[3-9]\d{9}/);
    expect(blob).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    MOCK_SIGNUPS.forEach((item) => {
      expect(item.id).toBeTruthy();
      expect(item.event_id).toBeTruthy();
      expect(item.event_title).toBeTruthy();
      expect(item.time_text).toBeTruthy();
      expect(item.space_name).toBeTruthy();
      expect(item.created_at).toBeTruthy();
    });
  });

  it('待填问卷数量与截图用 badging 一致（3 条）', () => {
    expect(computeCounts(MOCK_SIGNUPS).pending_survey).toBe(3);
  });
});

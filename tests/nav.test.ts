import { buildUrl, eventListUrl, parseQuery, ROUTES, surveyFillUrl, ticketDetailUrl } from '../miniprogram/logic/nav';

describe('路由 URL 构造', () => {
  it('survey=pending 的「填写问卷」跳 pages/survey/fill?event_id=', () => {
    expect(surveyFillUrl('evt_1009')).toBe('pages/survey/fill?event_id=evt_1009');
  });

  it('电子票跳 pages/ticket/detail，带活动与报名 id', () => {
    expect(ticketDetailUrl('evt_1001', 'sg_2001')).toBe(
      'pages/ticket/detail?event_id=evt_1001&signup_id=sg_2001',
    );
    expect(ticketDetailUrl('evt_1001')).toBe('pages/ticket/detail?event_id=evt_1001');
  });

  it('空状态「去看看活动」跳 pages/event/list', () => {
    expect(eventListUrl()).toBe('pages/event/list');
    expect(eventListUrl()).toBe(ROUTES.eventList);
  });

  it('buildUrl 对参数做 URL 编码并跳过空值', () => {
    expect(buildUrl('pages/a/b', { event_id: 'a b&c' })).toBe('pages/a/b?event_id=a%20b%26c');
    expect(buildUrl('pages/a/b', { event_id: '', signup_id: undefined })).toBe('pages/a/b');
    expect(buildUrl('pages/x', {})).toBe('pages/x');
  });

  it('参数按 key 字典序，保证同参数同 URL（便于缓存比较）', () => {
    expect(buildUrl('p', { b: '2', a: '1' })).toBe('p?a=1&b=2');
  });

  it('parseQuery 能还原编码后的参数', () => {
    expect(parseQuery({ event_id: 'evt%5F1' })).toEqual({ event_id: 'evt_1' });
  });
});

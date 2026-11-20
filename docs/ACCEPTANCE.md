# 验收自查清单（docs/ACCEPTANCE.md）

逐条对照客户验收标准，按本文件步骤可在 3 分钟内复现全部结论。

前置：

```bash
cd <项目根目录>
```

---

## AC-1 六种状态标签均可清楚看到并命名对应

**怎么验**

1. 打开 `screenshots/status.png`（长图，上「进行中」下「历史」）。
2. 逐张核对标签文案与配色：

| 序 | 卡片 | 标签文案 | 期望配色 | 位置 |
| --- | --- | --- | --- | --- |
| ① | 城市漫步·老城建筑导览 | 已报名 | 绿字 + 浅绿底 | 第一屏第 1 张 |
| ② | 周末手冲咖啡工作坊 | 候补第 3 位 | 橙字 + 浅橙底 | 第一屏第 2 张 |
| ③ | 独立开发者夜谈 第七期 | 审核中 | 蓝字 + 浅蓝底 | 第一屏第 3 张 |
| ④ | 亲子自然观察营（秋季场） | 未通过 | 灰字 + 浅灰底 | 第二屏第 1 张 |
| ⑤ | 深夜书影会·冬夜场 | 已取消 | 灰字 + 浅灰底 | 第二屏第 2 张 |
| ⑥ | 社区烘焙开放日 / 城市骑行·滨江线 | 已签到 | 绿底 + 白字 | 第二屏第 3、4 张 |

**代码单一来源**：`miniprogram/logic/signups.ts` → `STATUS_META`
**自动化**：`npx jest -t "状态标签"`、`npx jest -t "颜色表"`

**结论**：✅ 六态齐全，文案与配色一致；「已签到」两处均为绿底白字实心。

---

## AC-2 取消报名成功后卡片从「进行中」移入「历史」

**怎么验（单元测试）**

```bash
npx jest -t "取消成功"
```

覆盖两条链路：

- 纯逻辑：`cancelAndSplit(list, 'sg_1001', 'time_conflict', now)` → 返回 `active` 不含该 id、`history` 含该 id 且 `status === 'cancelled'`、`moved === true`。
- 接口层：`cancelSignup('sg_1001', 'time_conflict')` → `ok === true`；随后 `fetchSignups({ tab: 'active' })` 不含该条，`fetchSignups({ tab: 'history' })` 含该条（内存持久化）。

页面侧 `applyCanceled()` 用同一 `splitByTab()` 重建两栏，并刷新 `counts` 与角标。

**结论**：✅ 通过；取消后卡片落历史首位（`updated_at` 参与排序）。

---

## AC-3 `can_cancel=false` 不显示取消按钮

**怎么验**

```bash
npx jest -t "can_cancel"
```

- 构造 `can_cancel: false` 记录 → `cardActions(record).showCancel === false`。
- 构造 `can_cancel: true` → `true`。
- `components/signup-card/index.wxml` 中按钮由 `wx:if="{{actions.showCancel}}"` 控制，无其它兜底渲染。

**截图佐证**：`screenshots/status.png` 第一屏第 3 张「独立开发者夜谈 第七期」为审核中且 `can_cancel=false`，卡片底部没有「取消报名」，也没有操作栏分隔线。

**结论**：✅ 通过（逻辑层 + 视图层双重保证）。

---

## AC-4 `survey=pending` 显示「填写问卷」且跳转路径正确

**怎么验**

```bash
npx jest -t "填写问卷"
```

断言 `surveyFillUrl('ev_2007')` 返回 `pages/survey/fill?event_id=ev_2007`；页面 `onCardAction` 的 `case 'survey'` 直接 `wx.navigateTo({ url: surveyFillUrl(record.event_id) })`，参数经 `encodeURIComponent` 编码。

同时校验：

- `survey_status='pending'` → `showSurveyFill=true`、`showSurveyDone=false`，卡片展示「问卷截止 …」；
- `survey_status='submitted'` → 只显示「已提交问卷」（`btn-done` 灰色不可点）；
- 落点页 `pages/survey/fill` 用 `parseQuery()` 回显 `event_id`，可人工确认参数传递。

**截图佐证**：「社区烘焙开放日」卡片显示「问卷截止 11月30日 23:59」+「填写问卷」；「城市骑行·滨江线」显示「已提交问卷」。

**结论**：✅ 通过。

---

## AC-5 空状态截图包含「去看看活动」

**怎么验**：打开 `screenshots/empty.png`。

应看到：状态栏 9:41 → 导航栏「我的报名」→ Tab「进行中 / 历史」→ 空状态插画 → 主文案「还没有报名活动」→ 辅助文案 → 蓝色主按钮「去看看活动」。

按钮绑定 `onGoEvents` → `eventListUrl()` → `pages/event/list`（测试 `空状态「去看看活动」跳 pages/event/list`）。

**结论**：✅ 通过。

---

## 附加检查（交付质量）

| 项 | 命令 / 文件 | 结果 |
| --- | --- | --- |
| 类型检查 | `npx tsc --noEmit` | 0 error |
| 全量测试 | `npm run test:report` | 3 suites / 55 tests 全绿，落盘 `reports/jest.txt` |
| 截图可复现 | `bash scripts/shoot.sh preview/status.html out.png 390 2100` | OK（按内容裁掉底部空白） |
| 截图目视 | vision 复核 status / empty | 中文正常、无方块、无重叠、无裁切 |
| 数据合规 | `miniprogram/mock/signups.ts` | 20 条全虚构，无客户名 / 姓名 / 手机号 / 邮箱 |
| 无境外 SDK | `miniprogram/logic/api.ts` | 仅内存 mock，无第三方请求 |
| 无空壳函数 | `miniprogram/logic/*.ts` | 所有导出函数均有实现并被测试引用 |
| 界面文案 | `pages/**/*.wxml`、`components/**/*.wxml` | 全中文 |

## 已知偏差 / 说明

1. 交付环境无微信开发者工具，截图为 `preview/` 等价 HTML 渲染（1px = 2rpx，390 CSS px 宽），非真机截图；已在 `README.md`「已知限制」声明。
2. 角标使用 `t-tab-panel` 的 `badge-props`（透传 TDesign Badge），真机上的角标偏移量与字号以 TDesign 实际版本为准；`preview` 中按同一视觉规格绘制（红底白字、位于「历史」右侧）。
3. 活动列表 / 电子票 / 问卷填写三页为路由占位页，只保证跳转与参数回显。

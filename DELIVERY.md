# 交付说明（DELIVERY）#2244 / S3-MINI-064「我的报名页」

- 订单：2244 · S3-MINI-064
- 交付目录：仓库根目录
- 技术栈：微信小程序原生 + TypeScript + TDesign 小程序组件
- 自测日期：2026-11-21

## 一、验收标准 → 证据

| # | 验收标准（客户原文要点） | 证据文件 | 截图 / 测试用例 | 结果 |
| --- | --- | --- | --- | --- |
| 1 | 6 种状态标签各一张截图（已报名 / 候补第 N 位 / 审核中 / 未通过 / 已取消 / 已签到），可一张长图但每态清晰可辨 | `screenshots/status.png`（390 × 1619 CSS px 长图，上半屏「进行中」3 态、下半屏「历史」3 态）；`preview/status.html`；标签组件 `miniprogram/components/status-tag/index.{wxml,wxss,ts}`；颜色唯一来源 `miniprogram/logic/signups.ts` `STATUS_META` | 长图中依次出现：①「已报名」绿字浅绿底 ②「候补第 3 位」橙字浅橙底 ③「审核中」蓝字浅蓝底 ④「未通过」灰字浅灰底 ⑤「已取消」灰字浅灰底 ⑥「已签到」绿底白字；测试 `状态标签：6 种状态 → 文案 / 颜色类名`、`颜色表：已报名绿、候补橙、审核中蓝、未通过灰、已取消灰、已签到绿底白字` | ✅ 通过 |
| 2 | 取消报名成功后卡片从「进行中」移入「历史」 | `miniprogram/logic/signups.ts` `cancelAndSplit()` / `applyCancel()`；`miniprogram/logic/api.ts` `cancelSignup()`；页面 `applyCanceled()` | 截图：`screenshots/status.png` 下半屏「已取消」卡片；测试：`取消成功后：从进行中移除、出现在历史、状态为已取消`、`取消后进入历史首位（按状态变更时间排序）`、`取消成功：返回 ok，并从进行中移入历史`、`取消后再拉列表：进行中不含该条，历史含该条（状态持久化）` | ✅ 通过 |
| 3 | `can_cancel=false` 的报名不显示取消按钮 | `miniprogram/logic/signups.ts` `cardActions()`；`components/signup-card/index.wxml` 中 `wx:if="{{actions.showCancel}}"` | 截图：`screenshots/status.png` 第一屏第 3 张「独立开发者夜谈 第七期」（审核中，`can_cancel=false`，卡片无任何操作按钮）；测试：`can_cancel=false 不显示「取消报名」`、`can_cancel=true 显示「取消报名」` | ✅ 通过 |
| 4 | `survey=pending` 显示「填写问卷」并跳转 `pages/survey/fill?event_id=` | `miniprogram/logic/nav.ts` `surveyFillUrl()`；页面 `onCardAction` case `survey` → `wx.navigateTo({ url: surveyFillUrl(record.event_id) })` | 截图：`screenshots/status.png`「社区烘焙开放日」卡片显示「问卷截止 11月30日 23:59」+「填写问卷」按钮；测试：`survey=pending 的「填写问卷」跳 pages/survey/fill?event_id=`（断言返回值为 `pages/survey/fill?event_id=ev_...`）、`survey=pending 显示「填写问卷」，不显示「已提交问卷」`、`survey=submitted 只显示「已提交问卷」` | ✅ 通过 |
| 5 | 空状态截图包含「去看看活动」按钮 | `screenshots/empty.png`；`preview/empty.html`；页面 `index.wxml` 空状态分支；`logic/signups.ts` `buildEmptyState()` | 截图中文案「还没有报名活动」+ 蓝色按钮「去看看活动」清晰可见；测试：`列表为空时展示空状态与「去看看活动」`、`空状态「去看看活动」跳 pages/event/list` | ✅ 通过 |

### 其余需求点（一并落实）

| 需求 | 证据 | 验证 |
| --- | --- | --- |
| 顶部 `t-tabs`：进行中 / 历史 | `pages/me/signups/index.wxml` + `index.json` `usingComponents.t-tabs` | 截图两屏 Tab 均可见 |
| 历史栏标题旁「待填问卷」角标（`counts.pending_survey > 0`） | `logic/signups.ts` `historyBadge()`；页面 `badge` | 截图中「历史」旁红色角标「3」；测试 `有待填问卷时显示，数字等于待填数`、`没有待填问卷时隐藏角标（不显示 0）` |
| 卡片：封面缩略图、标题、时间、空间名、状态标签 | `components/signup-card/*` | 截图 7 张卡片均含四要素 + 标签 |
| 电子票 → `pages/ticket/detail` | `logic/nav.ts` `ticketDetailUrl()` | 截图「电子票」按钮；测试 `电子票跳 pages/ticket/detail，带活动与报名 id` |
| 取消原因 `t-action-sheet`（时间冲突 / 不再感兴趣 / 其他）+ 调 mock 接口 | 页面 `onSheetSelected`；`logic/signups.ts` `CANCEL_REASONS` | 测试 `三种取消原因都有中文文案`、`取消接口失败：返回 ok=false + 中文提示，且列表不移动` |
| `rejected` 可展开 `review_note` | `components/signup-card/index.wxml` 审核说明区；`expandedId` | 截图「未通过」卡片已展开审核说明；测试 `rejected 且有 review_note → 可展开审核说明` |
| `survey=submitted` 显示「已提交问卷」 | `cardActions().showSurveyDone` | 截图「城市骑行·滨江线」；测试同上 |
| 下拉刷新 + 触底加载 | 页面 `onPullDownRefresh` / `onReachBottom` / `loadMore`；`mergePage()` | 测试 `paginate 按页切片并给出 has_more`、`mergePage 按 id 去重合并，不产生重复卡片`、`mergePage 对空页安全` |
| 空状态 | `buildEmptyState()` + `empty.png` | 测试 `有数据时不展示空状态` |

## 二、自测结论

```
npx tsc --noEmit
→ 0 error

npx jest
→ Test Suites: 3 passed, 3 total
→ Tests:       55 passed, 55 total
→ Snapshots:   0 total
→ Time:        ~2.6 s
```

- 用例数：**55**（要求 ≥ 12），全部通过；报告落盘 `reports/jest.txt`（`npm run test:report`，含逐条用例名）。
- mock 数据：20 条虚构报名记录；状态分布 signed 3 / waitlist 2 / reviewing 3 / rejected 3 / cancelled 3 / checked_in 6；`can_cancel=true` 5 条；`ticket_available=true` 3 条；待填问卷 3 条（与截图角标一致）；列表 `active 8 / history 12`。
- 截图：2 张，均经 vision 复核（中文正常、无方块、无重叠、无裁切、颜色与图例一致、角标可见）。
  - `screenshots/status.png` 780 × 3238（2x，CSS 390 × 1619）
  - `screenshots/empty.png` 780 × 1303（2x，CSS 390 × 651）
- 合规：无客户名称、无真实姓名 / 手机号 / 邮箱 / 身份证号；`logic/api.ts` 未引入任何第三方 SDK，无外发请求。
- 无空壳函数：`logic/` 下 3 个模块共 20+ 个导出函数均有实现与测试覆盖；占位页（活动列表 / 电子票 / 问卷）仅承担路由落点，已在 README「已知限制」中声明。

## 三、文件清单

```
README.md
DELIVERY.md
docs/ACCEPTANCE.md
package.json  package-lock.json  tsconfig.json  jest.config.js
types/wx.d.ts
miniprogram/app.json  app.ts  app.wxss  project.config.json  sitemap.json
miniprogram/pages/me/signups/index.{ts,wxml,wxss,json}
miniprogram/pages/event/list/index.{ts,wxml,wxss,json}
miniprogram/pages/ticket/detail/index.{ts,wxml,wxss,json}
miniprogram/pages/survey/fill/index.{ts,wxml,wxss,json}
miniprogram/components/signup-card/index.{ts,wxml,wxss,json}
miniprogram/components/status-tag/index.{ts,wxml,wxss,json}
miniprogram/logic/signups.ts  nav.ts  api.ts
miniprogram/mock/signups.ts
tests/signups.test.ts  nav.test.ts  api.test.ts
preview/preview.css  pages.css  status.html  empty.html
screenshots/status.png  empty.png
reports/jest.txt
scripts/shoot.sh
```

## 四、复现命令

```bash
cd <项目根目录>
npx tsc --noEmit
npm run test:report
bash scripts/shoot.sh preview/status.html screenshots/status.png 390 2100   # 再按内容裁掉底部空白
bash scripts/shoot.sh preview/empty.html  screenshots/empty.png  390 900
```

# 我的报名（微信小程序 · TypeScript · TDesign）

活动报名小程序里的「我的报名」页：顶部「进行中 / 历史」两个 Tab，历史 Tab 标题旁带「待填问卷」角标；卡片展示封面缩略图、活动标题、时间、空间名与 6 种状态标签；按字段显示「电子票」「取消报名」「填写问卷 / 已提交问卷」；未通过报名可展开审核说明；支持下拉刷新、触底加载、空状态与加载失败重试。

全部界面文案为中文，全部数据为虚构示例数据。

## 目录结构

```
2244/
├─ miniprogram/                     # 小程序工程（微信开发者工具直接导入这一层）
│  ├─ app.json / app.ts / app.wxss  # 页面注册、全局样式
│  ├─ project.config.json / sitemap.json
│  ├─ pages/
│  │  ├─ me/signups/                # 本单交付的「我的报名」页（index.ts/wxml/wxss/json）
│  │  ├─ event/list/                # 空状态「去看看活动」落点（路由占位页）
│  │  ├─ ticket/detail/             # 「电子票」落点（路由占位页，回显 event_id / signup_id）
│  │  └─ survey/fill/               # 「填写问卷」落点（路由占位页，回显 event_id）
│  ├─ components/
│  │  ├─ signup-card/               # 报名卡片：封面 + 标题 + 时间 + 空间 + 状态标签 + 操作区
│  │  └─ status-tag/                # 状态标签组件：6 种状态 6 套配色
│  ├─ logic/                        # 纯逻辑，不 import wx，可被 Jest 直接测试
│  │  ├─ signups.ts                 # 状态映射、按钮可见性、Tab 分组、取消迁移、角标、分页
│  │  ├─ nav.ts                     # 路由 URL 构造（问卷 / 电子票 / 活动列表）
│  │  └─ api.ts                     # mock 数据访问层（对应 GET 列表 / POST 取消）
│  └─ mock/signups.ts               # 20 条虚构报名记录
├─ tests/                           # Jest 单元测试（3 个套件 / 55 个用例）
│  ├─ signups.test.ts               # 状态、按钮、分组、取消迁移、角标、分页、空状态
│  ├─ nav.test.ts                   # 路由 URL 与参数编码
│  └─ api.test.ts                   # mock 接口成功 / 失败 / 持久化
├─ types/wx.d.ts                    # 微信小程序宿主 API 的最小类型声明（供 tsc 使用）
├─ preview/                         # 截图用 HTML 预览（与 WXSS 数值等价：1px = 2rpx）
│  ├─ preview.css                   # 状态栏 / 导航栏 / Tab 等框架样式
│  ├─ pages.css                     # 卡片、状态标签、空状态样式
│  ├─ status.html                   # 6 种状态同屏（进行中 + 历史两屏）
│  └─ empty.html                    # 空状态
├─ screenshots/
│  ├─ status.png                    # 6 种状态长图
│  └─ empty.png                     # 空状态图
├─ reports/jest.txt                 # npm run test:report 的落盘结果
├─ scripts/shoot.sh                 # headless Chrome 截图脚本
├─ docs/ACCEPTANCE.md               # 验收标准 → 证据对照
├─ README.md
└─ DELIVERY.md
```

## 运行方法（微信开发者工具）

1. 安装依赖并构建 npm（TDesign 组件需要走小程序 npm 构建）：

   ```bash
   cd miniprogram   # 或在仓库根目录执行 npm i tdesign-miniprogram
   npm i tdesign-miniprogram
   ```

   本仓库的 `package.json` 只声明了 `tdesign-miniprogram` 依赖，交付环境未执行安装；`wxml` 里通过 `usingComponents` 引用 `tdesign-miniprogram/tabs/tabs`、`tdesign-miniprogram/tab-panel/tab-panel`、`tdesign-miniprogram/action-sheet/action-sheet`。

2. 微信开发者工具 →「导入项目」→ 目录选择 `miniprogram/`，AppID 可用测试号。
3. 工具菜单「工具 → 构建 npm」，勾选「使用 npm 模块」，即可加载 TDesign 组件。
4. 编译后默认进入 `pages/me/signups/index`。

## 测试方法

```bash
npx jest                 # 全量单元测试
npm run test:report      # 生成 reports/jest.txt（含逐条用例名）
npx tsc --noEmit         # 类型检查
```

当前结果：**3 个套件 / 55 个用例全部通过**。

业务逻辑全部在 `miniprogram/logic/`，测试直接 `import` 这些模块，不依赖 `wx` 运行时；页面 `index.ts` 只做 `setData`、事件绑定与 `wx.navigateTo`。

## 状态标签与按钮规则

| 状态 `status` | 标签文案 | 配色 | 归属 Tab |
| --- | --- | --- | --- |
| `signed` | 已报名 | 绿字浅绿底 `#2ba471` / `#e3f9e9` | 进行中 |
| `waitlist` | 候补第 N 位（取 `waitlist_no`） | 橙字浅橙底 `#e37318` / `#fff1e9` | 进行中 |
| `reviewing` | 审核中 | 蓝字浅蓝底 `#0052d9` / `#e3f0ff` | 进行中 |
| `rejected` | 未通过 | 灰字浅灰底 `#8b8b8b` / `#eeeeee` | 历史 |
| `cancelled` | 已取消 | 灰字浅灰底 `#8b8b8b` / `#eeeeee` | 历史 |
| `checked_in` | 已签到 | 绿底白字 `#2ba471` / `#ffffff` | 历史 |

颜色唯一来源是 `logic/signups.ts` 的 `STATUS_META`，`status-tag` 组件、`wxss`、`preview/pages.css` 三处数值与之一致。

按钮可见性（`cardActions()`）：

- `ticket_available === true` → 显示「电子票」，跳 `pages/ticket/detail?event_id=&signup_id=`
- `can_cancel === true` → 显示「取消报名」，点击弹 `t-action-sheet`（时间冲突 / 不再感兴趣 / 其他）
- `survey_status === 'pending'` → 显示「填写问卷」+ 截止时间，跳 `pages/survey/fill?event_id=`
- `survey_status === 'submitted'` → 只显示「已提交问卷」（灰色不可点）
- `status === 'rejected'` 且 `review_note` 非空 → 可展开「审核说明」

「历史」Tab 角标：`historyBadge(counts)` 决定是否显示，页面转成 `badgeProps = { count, showZero: false }`，通过 `t-tab-panel` 的 `badge-props` 交给 TDesign Badge 渲染；`pending_survey === 0` 时传 `null`，即不显示角标。

## Mock 接口对接点

### 1. 我的报名列表

```
GET /api/mini/me/signups?page=1&page_size=6&tab=active
```

`tab`：`active` 进行中 / `history` 历史 / `all` 全部。响应：

```json
{
  "list": [
    {
      "id": "sg_1001",
      "event_id": "ev_2001",
      "event_title": "城市漫步·老城建筑导览",
      "time_text": "12月06日 周六 14:00-16:30",
      "space_name": "拾光共创空间 3F·梧桐厅",
      "status": "signed",
      "waitlist_no": null,
      "ticket_available": true,
      "can_cancel": true,
      "review_note": null,
      "survey_status": "none",
      "survey_deadline": null,
      "created_at": "2026-11-18 10:20:00",
      "updated_at": null,
      "cover_url": ""
    }
  ],
  "counts": { "pending_survey": 3, "total": 20, "active": 8, "history": 12 },
  "page": 1,
  "page_size": 6,
  "has_more": true
}
```

- `counts.pending_survey` 是「历史」Tab 角标数字的来源，`> 0` 时才显示，等于待填问卷条数。
- `has_more` 控制触底加载；分页按 `page` / `page_size` 切片，客户端用 `mergePage()` 按 `id` 去重合并。
- `time_text` / `space_name` 由服务端格式化好，前端直接渲染；`cover_url` 为空时用渐变占位（`coverStyle()`）。

### 2. 取消报名

```
POST /api/mini/me/signups/{id}/cancel
Content-Type: application/json

{ "reason": "time_conflict" }
```

`reason` 取值：`time_conflict`（时间冲突）/ `not_interested`（不再感兴趣）/ `other`（其他）。

- 成功：`ok: true`，该条 `status` 变为 `cancelled`、`can_cancel` 与 `ticket_available` 置 `false`，从「进行中」移入「历史」并置顶。
- 失败：`ok: false` + 中文 `message`，列表不变，页面 toast 提示。

mock 实现见 `logic/api.ts`（`fetchSignups` / `cancelSignup`），函数签名与真实请求一致，接入时把内部实现换成 `wx.request` 即可，页面代码无需改动。

## 已知限制

- 交付环境没有微信开发者工具，**页面渲染效果由 `preview/` 下的等价 HTML + headless Chrome 截图产出**，不是真机截图；`scripts/shoot.sh` 可复现。
- `preview/` 与小程序 WXSS 数值等价（`1px = 2rpx`，390 CSS px 宽），但 TDesign 组件的原生细节（Tab 下划线动画、ActionSheet 动效）以真机为准。
- `pages/event/list`、`pages/ticket/detail`、`pages/survey/fill` 是路由占位页，只保证跳转与参数回显；正式页面由对应业务模块提供。
- mock 数据存在内存中，重启小程序即恢复初始 20 条。
- 电子票、问卷表单的提交接口不在本单范围。

## 虚构数据声明

`miniprogram/mock/signups.ts` 中 20 条报名记录的活动名、空间名、企业/机构名、审核说明、时间均为虚构，仅用于界面演示与单元测试：

- 不包含任何客户名称、真实企业名称；
- 不包含真实姓名、手机号、邮箱、身份证号等个人信息；
- 页面与预览图中出现的「拾光共创空间」「谷雨生活馆」「云栖共享办公」等均为虚构场所名。

## 验收对照

见 `DELIVERY.md` 与 `docs/ACCEPTANCE.md`。

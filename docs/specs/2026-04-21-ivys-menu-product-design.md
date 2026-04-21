# Ivy's Menu — 产品设计 Spec

> **归属说明**：此 spec 描述的是一个**独立的新产品**（新仓库、新 Supabase 项目、新域名），并非 SkillQuest 的功能扩展。文档存放在 SkillQuest 的 `docs/superpowers/specs/` 仅作为设计讨论的存档。实际实现应在新仓库进行。
>
> **讨论日期**：2026-04-21
> **讨论方式**：Claude Code 对话 + visual brainstorming companion
> **状态**：设计已通过用户 review，待实现计划撰写（writing-plans）

---

## 1. 产品定位

**Ivy's Menu** 是一家"只为 Ivy 一人开的私人家庭餐厅"。

- **主厨**：项目主人（一个人），负责维护菜单、接单、采购、做菜
- **唯一顾客**：Ivy（主厨的女友），负责浏览菜单、下单、"支付"、用餐

产品解决两类问题：

1. **情感仪式**：把"今天吃什么"的日常对话，变成"我为你开了家餐厅"的持续情感叙事
2. **饮食规划实用性**：本周要做什么 / 要买什么 / 现在做哪一顿，替代"脑子里记"和"微信对话里问"

### 1.1 优先级

产品最初由 4 个诉求派生：

| ID | 诉求 | 优先级 |
|----|------|------|
| A1 | 执行辅助：每天一键看到"今天做什么"+菜谱入口 | **1（v1 必做）** |
| C2 | 采购规划：一周菜单汇总采购清单 | **2（v1 必做）** |
| B3 | 健康约束：营养/热量目标 | 3（v2） |
| D4 | 复盘记录：含外食的饮食结构回顾 | 4（v2） |

### 1.2 做饭节奏

产品设计基于主厨的真实节奏：

- **工作日早餐**（周一–周五）：每天给 Ivy 做；同一锅做 2 份（Ivy 1 份早餐 + 主厨 1 份便当带去公司当午餐）
- **工作日晚餐**（周一–周五）：2 人食，认真做。**v1 统一"一荤两素"套餐结构**
- **周末早餐**（周六、周日）：给 Ivy 做
- **周末午/晚**：不排死（外食/临时决定/放松日），走"候选池"

---

## 2. 产品形态与部署

### 2.1 单部署 + 双 PWA 入口

**工程事实**：一个 Netlify 站点、一份代码仓库、一个域名，部署一次。

**用户感受**：两个独立的 app，各自在手机主屏有独立图标。

```
https://ivys.menu                      # 域名待购
  ├─ /                                 # 首次访问：让人选角色
  ├─ /menu/*                           # Ivy 的餐厅端
  │    ├─ manifest.json                # 独立 manifest：名称"Ivy's Menu" + 🍽️ 图标
  │    └─ 安装到主屏 → 独立 app 图标
  └─ /kitchen/*                        # 主厨的后厨端
       ├─ manifest.json                # 独立 manifest：名称"后厨 Kitchen" + 👨‍🍳 图标
       └─ 安装到主屏 → 另一个独立 app 图标
```

### 2.2 身份识别：无登录

**设计约束**：就 2 个人用，不做账号系统。

- **角色判定**：`localStorage.role = 'ivy' | 'chef'`
- **首次访问 `/`**：显示大按钮"我是 Ivy" / "我是主厨"，选一次后写入 localStorage，之后所有后续访问自动路由到对应端
- **切换设备**：第一次打开时重选
- **"安全性"**：URL 公开，但知道 URL 的陌生人极少；若担心，可加一个简单的"共享 PIN"作为首次访问闸门。v1 默认不做
- **"主厨 vs Ivy" 的访问控制**：只由 localStorage 的 role 决定。`/kitchen/*` 路径直接渲染 chef 页面；非 chef 角色访问 `/kitchen/*` 时跳转到 `/`

### 2.3 技术栈

| 层 | 选型 |
|---|------|
| 框架 | Next.js 15 (App Router) + React 19 + TypeScript 5 |
| 样式 | Tailwind 4 + Framer Motion 12 |
| 数据库 | Supabase (PostgreSQL) — **新建独立项目**，与 SkillQuest 彻底隔离 |
| 部署 | Netlify（单站点） |
| 图片存储 | Supabase Storage（菜品封面图） |
| 运行时 LLM | **无**。所有 AI/内容任务在 Claude Code 会话里完成，不通过 app 调用外部 LLM |
| 实时推送 | **无**。厨房端每次打开时拉取最新订单（不用 Supabase Realtime websocket） |

---

## 3. 数据模型

### 3.1 核心表

```sql
-- 菜谱库
create table recipes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,                -- "奶油蘑菇汤"
  emoji               text not null,                -- "🍲"（图片加载失败兜底）
  cover_image_url     text not null,                -- 主厨录入时提供的真图 URL
  short_desc          text not null,                -- <= 40 字，菜单网格上的小字
  taste_tags          text[] default '{}',          -- ["咸鲜", "暖"]
  price               int not null,                 -- ¥ 价格（整数，单位：元），支付仪式用

  role                text not null,                -- 'main' | 'side'
  meal_type           text not null,                -- 'breakfast' | 'dinner' | 'weekend'
  serving_default     int not null default 1,       -- 默认做几份（早餐默认 2）
  cook_time_min       int not null,
  difficulty          text not null default 'normal', -- 'easy' | 'normal' | 'hard'

  ingredients         jsonb not null,               -- [{name, amount, unit, category}]
  steps               jsonb not null,               -- [{content, duration_min, phase}]
  tips                text,
  source_url          text,                         -- 菜谱来源

  is_active           boolean not null default true, -- 是否在"本周在架"菜单
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint recipes_role_check check (role in ('main', 'side')),
  constraint recipes_meal_type_check check (meal_type in ('breakfast', 'dinner', 'weekend')),
  constraint recipes_difficulty_check check (difficulty in ('easy', 'normal', 'hard'))
);

create index recipes_meal_type_role_idx on recipes (meal_type, role, is_active);

-- 订单（女友下单的每一餐）
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  main_recipe_id      uuid not null references recipes(id),
  serving             int not null default 1,        -- 早餐默认 2（Ivy 1 + 便当 1），晚餐默认 2（2 人食）
  meal_date           date not null,                 -- 这一餐吃的日期
  meal_type           text not null,                 -- 'breakfast' | 'dinner' | 'weekend'

  status              text not null default 'placed',
  placed_at           timestamptz not null default now(),
  accepted_at         timestamptz,
  cooking_at          timestamptz,
  done_at             timestamptz,
  cancelled_at        timestamptz,

  paid_at             timestamptz not null default now(),  -- "支付成功"时间（v1 与 placed_at 一致）
  price_snapshot      int not null,                         -- 下单时 recipe.price 的快照

  note                text,                           -- Ivy 的备注（"少放辣"这种）

  constraint orders_status_check check (status in ('placed', 'accepted', 'cooking', 'done', 'cancelled')),
  constraint orders_meal_type_check check (meal_type in ('breakfast', 'dinner', 'weekend'))
);

create index orders_meal_date_status_idx on orders (meal_date, status);

-- 订单配菜（β 方案：晚餐素菜由主厨在厨房视图搭配）
create table order_sides (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  side_recipe_id      uuid not null references recipes(id),
  assigned_at         timestamptz not null default now(),
  unique (order_id, side_recipe_id)
);

-- 本周采购清单（由 Claude Code 会话生成）
create table purchase_lists (
  id                  uuid primary key default gen_random_uuid(),
  week_start          date not null unique,          -- 本周一
  items               jsonb not null,                -- [{name, amount, unit, category, checked}]
  generated_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- 家庭信用卡累计（支付仪式的副产品）
create view card_stats as
  select
    count(*) as total_orders,
    sum(price_snapshot) as total_spent,
    min(paid_at) as first_paid_at,
    max(paid_at) as last_paid_at
  from orders
  where status != 'cancelled';
```

### 3.2 "一荤两素" 的 β 实现

**约束**：v1 晚餐必须统一"一荤两素"（1 main + 2 side）。

**实现**：
- **Ivy 端**：下晚餐订单时，只选 1 道荤（`recipes.role='main' AND recipes.meal_type='dinner'`）。菜单页在晚餐 section 的尾部注明"♡ 主厨将为您搭配两道当季时蔬"
- **主厨端**：在 `/kitchen/menu-admin` 维护 side 菜谱库。收到晚餐订单后，在厨房视图点击订单 → 选 2 道 side 绑定到 `order_sides`
- **时机**：绑定可以在"接单时"、"做饭时"、"采购前"任意时点完成。`order_sides` 空列表时晚餐依然可进入 `cooking` 状态（但会在订单卡上标注"未配菜"提示）

**早餐/周末**：没有荤素区分。早餐 order 只有 1 道 main（"蘑菇欧姆蛋"），serving=2。周末可点 main 或 side 自由。

### 3.3 订单生命周期

```
               [支付仪式完成] → placed
                                  │
                                  │ 主厨"接单"
                                  ▼
                               accepted       (厨房视图状态 badge 变化)
                                  │
                                  │ 主厨"开始制作"
                                  ▼
                               cooking        (Ivy 端看到"🧑‍🍳 正在为您制作")
                                  │
                                  │ 主厨"出餐"
                                  ▼
                                done

                 (支路) cancelled - 主厨或 Ivy 任一方取消
```

- **状态推进**：全部由主厨端按钮触发。Ivy 端只读状态
- **取消**：
  - Ivy 在 `placed` / `accepted` 状态可以取消
  - 主厨在任何非 `done` 状态可以取消（带备注"食材不足"/"今日临时外出"等）
  - 取消后资金"退回"家庭信用卡（累计数字减回去）

---

## 4. 页面清单

### 4.1 Ivy 端 `/menu/*`

| 路径 | 页面 | 核心功能 | 视觉风格 |
|---|---|---|---|
| `/menu` | 菜单首页 | 今日订单状态 + 菜单入口 + 支付卡片入口 | C 高饱和大图网格 |
| `/menu/order-week` | 周日批量预订 | 下周 7 早 + 5 晚的日历网格，每格点击选菜 | A 日历网格 7×2 |
| `/menu/order-single` | 周末/现点单次下单 | 单次从菜单网格点击一道 → 结算 | C 网格 |
| `/menu/checkout` | 支付仪式 | 家庭信用卡卡面 + 6 位密码输入 | C 家庭信用卡 |
| `/menu/orders` | 我的订单 | 时间轴展示已下单的订单及状态 | 时间轴 |
| `/menu/card` | 家庭信用卡 | 查"本月累计"、"本月花费"、卡面装饰 | 卡面展示 |

**菜单首页布局（`/menu`）**：
- 顶部：今日状态 Banner（"🍲 今天晚上厨房会为你做奶油蘑菇汤 · 正在制作"）
- 中部：本周菜单网格（按 meal_type tab 切换：早餐 / 晚餐 / 周末）
- 底部：快捷入口（"周日预订"开放期间高亮 / "我的订单" / "家庭信用卡"）

### 4.2 主厨端 `/kitchen/*`

| 路径 | 页面 | 核心功能 | 视觉风格 |
|---|---|---|---|
| `/kitchen` | 今日视图 | 今日早餐/晚餐大卡片 + 本周预订进度 + 本周采购项数 | A 今日优先 |
| `/kitchen/week` | 本周订单 | 日历展示本周所有订单状态 | 日历 |
| `/kitchen/purchase` | 采购清单 | 当周采购清单，支持勾选、按类目折叠 | 列表 |
| `/kitchen/menu-admin` | 菜单管理 | 切换菜谱 `is_active`、为晚餐订单绑定 2 道 side、重置信用卡密码 | 双面板 |
| `/kitchen/recipes` | 菜谱库列表 | 所有 recipes 的检索/预览入口 | 列表 |
| `/kitchen/recipes/[id]` | 菜谱详情 | 做菜时看：ingredients + steps 时间线 + tips | 单列深阅读 |
| `/kitchen/orders/[id]` | 订单详情 | 接单/开始/出餐按钮 + 绑定 side 入口 | 单列 |

---

## 5. 支付仪式（Ivy 端 `/menu/checkout`）

**目标**：每次下单后（无论是周日批量还是周末单次），有 3-5 秒的仪式时刻。

**视觉**：
- 背景：深紫到深蓝渐变，占满屏
- 中央：一张"家庭信用卡"卡面
  - 卡面渐变：紫色主题（`#7c3aed → #3b82f6`）
  - 卡头："HOUSEHOLD CARD" 小字标识 + 一个金色芯片
  - 卡号：`•••• •••• •••• ❤️❤️❤️`（固定装饰，不是真卡号）
  - 持卡人：显示 `IVY` 或"我的宝贝"（主厨配置）
  - 有效期：`∞/∞`
- 卡下方：金额显示（如 `¥ 126`）
- 密码输入：6 个圆点占位符 + 数字键盘（H5 自定义，避免触发系统键盘）
- 密码值：**主厨在 `/kitchen` 某处一次性设定**（如 `020202` = 2 月 2 号纪念日）。密码错误 3 次"锁定 30 秒"作为 playful 反馈

**流程**：
1. 选完菜 → 点"结账" → 进入 `/menu/checkout`
2. 输入 6 位密码 → 正确 → 卡面抖动 + "支付中" 0.8 秒 → `✓ 支付成功` 1 秒 → 自动跳转到 `/menu/orders`
3. 订单被创建，`paid_at = now()`

**家庭信用卡累计页 `/menu/card`**：
- 卡面装饰（同 checkout 页）
- 统计块："本月为你花了 `¥ xxx`" / "累计共 `xxx` 单" / "最爱的一道菜是 `xxx`（点了 `N` 次）"
- 数据来源：`card_stats` view

---

## 6. 周日批量预订流程（Ivy 端 `/menu/order-week`）

**时机**：每周日开放，建议 Ivy 在周日晚上用 10-15 分钟完成。

**UI 结构**（A 日历网格）：

```
┌─────────────────────────────────────────┐
│  本周预订 · Apr 22 - Apr 26             │
│                                         │
│              🍳 早        🍲 晚         │
│  周一   [ 蘑菇蛋 ]   [ + 选择 ]         │
│  周二   [ + 选择 ]   [ 奶油汤 ]         │
│  周三   [ + 选择 ]   [ + 选择 ]         │
│  周四   [ + 选择 ]   [ + 选择 ]         │
│  周五   [ + 选择 ]   [ + 选择 ]         │
│                                         │
│  已订 3 / 12             小计 ¥ 318    │
│                                         │
│           [ 完成预订 · 去支付 ]         │
└─────────────────────────────────────────┘
```

- 点空格子 → 底部 sheet 弹出当餐菜单（早餐 7 道 / 晚餐 5 道）→ 选一道 → 回到日历，格子显示菜名+图
- 允许部分格子留空（对应那一餐那天不在家 / 外食）
- "完成预订" → 进入 `/menu/checkout` → **一次性**支付所有预订的合计金额（checkout 页显示总金额 = Σ 各菜 `price`）
- 支付成功后：为每个非空格子创建一条 `orders`（每条记录自己的 `price_snapshot` = 该餐菜谱当时的 `price`；同一批订单共享同一个 `paid_at`），`meal_date` 对应实际日期，`status=placed`

**周末现点**（`/menu/order-single`）：
- 直接进入 `meal_type=weekend` 的菜单网格
- 点一道菜 → 数量选择（默认 1）→ "确认" → 支付仪式 → 创建 1 条 order

---

## 7. 菜谱录入与维护（Claude Code 会话驱动）

**产品本身不提供 GUI 录菜谱**。所有菜谱维护通过主厨与 Claude Code 的对话完成。

**典型流程**：

```
主厨："加一道菜：黄油芦笋，晚餐配菜，约 10 min，这里是小红书链接 <url>"

Claude：
  1. 按需读小红书链接（通过 web-access skill）
  2. 结构化成 recipes 字段：
     - 生成 name, emoji, short_desc
     - 抽 ingredients（含 category 分类）
     - 整理 steps（含 phase: 备菜/主做/收尾 + duration_min）
     - 推断 role=side, meal_type=dinner
  3. 让主厨确认 cover_image_url（主厨手动提供）
  4. 通过 Supabase client 或 SQL 写入 recipes 表

主厨："周日，给本周生成采购清单"

Claude：
  1. 读本周所有 orders（含 order_sides）
  2. 对应 recipes.ingredients 聚合（按 category 归组、按 name+unit 汇总）
  3. 写入 purchase_lists（week_start, items）
  4. 回复"清单已生成，共 18 项，你现在可以在 /kitchen/purchase 查看"
```

**short_desc 风格**（Claude 生成时遵循）：
- <= 40 字
- 简短 + 情绪暗示（"暖"、"晨光"、"雨天限定"、"妈妈手艺"）
- 避免广告口吻（"独家秘方"、"绝味"等）
- 避免堆形容词

---

## 8. 单菜烹饪时间线（`/kitchen/recipes/[id]`）

基于 `steps.phase` + `duration_min` 生成单菜的时间规划：

```
总耗时 32 min · 预计 19:00 出餐
         └─ 18:28 开始

18:28 │ [备菜] 洗蘑菇、切片（3 min）
18:31 │ [备菜] 切洋葱末（2 min）
18:33 │ [主做] 黄油融化，煸洋葱（5 min）
18:38 │ [主做] 下蘑菇煸炒（6 min）
18:44 │ [主做] 加奶油 + 高汤，小火煮（12 min）
18:56 │ [收尾] 调味、盛盘、撒欧芹（4 min）
19:00 │ ✓ 出餐
```

- 出餐时间从"这顿餐应吃的时间"反推（早餐 7:30 / 晚餐 19:00 默认值可配置）
- v1 不做**多道菜同时做的统一调度**（例如晚餐荤 + 2 素的并行时间线）。每道菜独立看时间线

---

## 9. v1 范围

### 9.1 必做（v1 MVP）

- [x] 双 PWA 部署 + 角色选择（无登录）
- [x] 菜单网格（C 高饱和大图）
- [x] 周日批量预订（A 日历网格）
- [x] 周末单次下单
- [x] 家庭信用卡支付仪式（含密码验证 + 累计统计页）
- [x] 订单状态流（placed → accepted → cooking → done + cancelled）
- [x] 厨房今日视图（A 今日优先）
- [x] 本周订单/采购/菜谱子页
- [x] 菜谱详情与烹饪时间线（单菜）
- [x] `/kitchen/menu-admin` 管理 `is_active` + 绑定 side
- [x] 菜谱录入依赖 Claude Code 会话（不在产品内）
- [x] 采购清单生成依赖 Claude Code 会话

### 9.2 不做（推到 v2+）

- ❌ 营养/热量分析（B3）
- ❌ 复盘报表（D4）
- ❌ 多道菜并行调度时间线
- ❌ 运行时 LLM（对话式点餐、智能推荐）
- ❌ 食材库存管理
- ❌ 语音烹饪助手
- ❌ 多用户账号 / 第三人访问
- ❌ 订单推送（电话/短信/邮件通知）
- ❌ 实时 Websocket（厨房端靠打开时拉取）

---

## 10. 视觉设计语言

参考 SkillQuest 的紫色主轴，但 Ivy's Menu 独立调色：

| Token | 值 | 用途 |
|---|---|---|
| `--bg` | `#000` (dark 默认) | 菜单/厨房主背景，支撑高饱和菜品图 |
| `--accent-primary` | `#7c3aed` | 主 CTA、家庭信用卡主色 |
| `--accent-warm` | `#f59e0b → #ec4899` 渐变 | 早餐/温暖类菜品 |
| `--accent-cool` | `#3b82f6 → #10b981` 渐变 | 清爽/素菜类 |

- **字体**：待定。候选：`Inter` (UI) + `Playfair Display` / `Noto Serif SC`（"Ivy's Menu" logo 用衬线增加餐厅感）
- **图标**：可复用 SkillQuest 已有的 SVG icon 系统（直接 copy 过来或抽成 npm 包）或选 Lucide
- **动画**：Framer Motion：
  - 卡面支付：spring + 抖动
  - 订单状态变化：scale + 色值过渡
  - 厨房"接单"按钮：触发声效（可选）

---

## 11. 启动顺序建议

建议实现顺序（每一步都可独立部署到 Netlify 验证）：

1. **Foundation**
   - 建 Supabase 新项目，建表（recipes / orders / order_sides / purchase_lists）
   - 建 Next.js 项目，Tailwind 4 + Framer Motion 配置
   - 部署空壳到 Netlify，打通 env

2. **Recipe viewing (chef-side read)**
   - `/kitchen/recipes` + `/kitchen/recipes/[id]`
   - 通过 Claude Code 会话手动录入 12 道菜（7 早 + 5 晚的起步量）+ 若干 side
   - 验证 ingredients/steps/cover_image 都能正确展示

3. **Menu browsing (Ivy-side read)**
   - `/` 角色选择 + 双 PWA manifest
   - `/menu` 菜单网格（C 风格）
   - 验证 PWA 在手机主屏安装后图标/启动页正确

4. **Single order flow**
   - `/menu/order-single` + `/menu/checkout` + 家庭信用卡支付仪式
   - `/menu/orders` 订单状态展示（只读）
   - `/kitchen/orders/[id]` + `/kitchen` 今日视图 + 状态推进按钮
   - 跑通最小闭环：Ivy 下周末单 → 支付 → 主厨接单 → 制作 → 出餐

5. **Weekly pre-order**
   - `/menu/order-week` 日历网格
   - 批量结账 → 批量创建订单

6. **Side binding & menu admin**
   - `/kitchen/menu-admin`（`is_active` 切换 + 每单 side 绑定）
   - 晚餐订单展示荤+素完整菜品

7. **Purchase list**
   - `/kitchen/purchase` 清单勾选 UI
   - 通过 Claude Code 会话生成测试数据 → 验证查看/勾选

8. **Card stats & polish**
   - `/menu/card` 累计统计
   - 动画、过渡、错误态打磨

---

## 12. 开放问题与风险

| 问题 | 状态 | 备注 |
|---|---|---|
| 密码在前端做验证还是后端？ | 待定 | 建议：后端 `POST /api/checkout` 对密码做校验。密码明文存 env 或 Supabase `settings` 表 |
| 家庭信用卡的"余额"是虚拟还是限额？ | 待定 | v1 建议：纯累计，无上限。v2 可加"本月预算 ¥xxx"做游戏化 |
| `meal_date` 与 `meal_type` 的冲突校验？ | 待定 | 周日不能点"周一的早餐"如果周一已被占？→ 建议允许多订，Ivy 可自由加点多份 |
| `side` 菜谱的展示 | 待定 | Ivy 能看到当晚配的素菜吗？建议：cooking 状态起在订单卡显示完整"荤+素"详情 |
| 取消后"支付累计"是否回退？ | 已决定 | 是。`card_stats` 基于 `status != 'cancelled'`，天然回退 |
| 域名 | 待定 | 首选 `ivys.menu`，备选 `ivysmenu.app` / `forivy.cafe` |
| 密码忘记怎么办？ | 已决定 | 主厨在 `/kitchen/menu-admin` 的"系统设置"小区块可重置 6 位密码，无需二次验证（信任模型：主厨是后端唯一维护者）。v1 初始密码在首次进入主厨端时引导设置 |
| 订单时间戳的时区处理 | 已决定 | 简化：全部按 `Asia/Shanghai`。`meal_date` 是 DATE 类型（无时区），逻辑按 CT 解释 |

---

## 13. 为什么值得做

- **情感密度**：每次做饭→被点单→支付→送餐都是一次微型情感事件。累积起来形成"我们的故事"
- **工程友好**：一个开发者（你自己）能在一周内跑通 MVP，Next.js + Supabase 栈熟悉
- **边际成本低**：运行时无 LLM 依赖，Supabase + Netlify 免费档完全够 2 人用
- **有演进空间**：v2 可以加 AI（她就算不会做饭也能和"厨房"对话点单）、营养、复盘、家庭账本等

---

## 14. 下一步

- [ ] 此 spec 经用户 review 后，调用 `writing-plans` skill 生成分阶段实现计划
- [ ] 在新仓库（建议命名 `ivys-menu` 或 `household-kitchen`）初始化项目
- [ ] 购买域名 `ivys.menu`
- [ ] 新建 Supabase 项目，执行初始 schema migration

---

*设计讨论完成于 2026-04-21。下一步：`writing-plans` 生成实现计划。*

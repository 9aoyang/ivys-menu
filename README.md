# Ivy's Menu

家庭私人餐厅 · 主厨一人、顾客一人。

## Phase 1 已交付

- 双 PWA 入口（`/menu` + `/kitchen`），单 Netlify 部署
- 角色识别走 localStorage，无登录
- 菜谱库（chef 端阅读 + 烹饪时间线）
- 菜单浏览（Ivy 端，3 meal-type tab）
- 单次下单流程（含家庭信用卡支付仪式）
- 订单状态流转（placed → accepted → cooking → done）

## 本地开发

```bash
cp .env.local.example .env.local
# 填入 Supabase 凭据 + 6 位支付密码

npm install
npm run seed       # 初始 2 道菜
npm run dev
```

访问 http://localhost:3000

## 内容维护

所有菜谱录入、采购清单生成等"智能"任务都在 **Claude Code 对话** 里完成，而不是通过 app UI。直接告诉 Claude："加一道菜：XXX"，它会从食谱链接/描述结构化后写入 Supabase。

## 脚本

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器 (Turbopack) |
| `npm run build` | 生产构建 |
| `npm test` | 单元 + 集成测试（需要 `.env.local`） |
| `npm run seed` | 录入初始菜谱（开发环境） |
| `supabase db push --linked` | 把 `supabase/migrations/` 同步到远程 |

## 部署

- **GitHub**: https://github.com/9aoyang/ivys-menu
- **Netlify**: https://legendary-gecko-fb557e.netlify.app（自定义域名 `ivys.menu` 待购）
- Netlify 环境变量需要和 `.env.local` 保持一致；不要给 `SUPABASE_SERVICE_ROLE_KEY` 加 `NEXT_PUBLIC_` 前缀

## 文档

- 产品 spec：`docs/specs/2026-04-21-ivys-menu-product-design.md`
- Phase 1 计划：`docs/plans/2026-04-21-ivys-menu-phase1-mvp.md`
- 架构笔记 + Next.js 16 注意点：`.stackpilot/ARCHITECTURE.md`
- Phase 2 计划：Phase 1 收尾后再生成

## Phase 2 预告（占位页已到位，代码未写）

| 路由 | 功能 |
|---|---|
| `/menu/order-week` | 周日批量预订日历 |
| `/menu/card` | 家庭信用卡累计页 |
| `/kitchen/week` | 本周订单日历 |
| `/kitchen/purchase` | 采购清单勾选 |
| `/kitchen/menu-admin` | `is_active` 切换 + 为晚餐订单绑定 side |

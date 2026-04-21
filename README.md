# Ivy's Menu

家庭私人餐厅 · 主厨一人、顾客一人。

## 状态

- ✅ 产品设计 spec：`docs/specs/2026-04-21-ivys-menu-product-design.md`
- ✅ Phase 1 实施计划：`docs/plans/2026-04-21-ivys-menu-phase1-mvp.md`
- ⏳ 代码尚未初始化。下一步按 Phase 1 计划 Task 0.1 执行 `create-next-app` 初始化项目。

## 产品定位

Ivy's Menu 是一家"只为 Ivy 一人开的私人家庭餐厅"。
主厨（项目主人）维护菜单、接单、采购、做菜；Ivy 浏览菜单、下单、走支付仪式、用餐。

- 技术栈：Next.js 15 + 独立 Supabase + Tailwind 4 + Framer Motion
- 部署：Netlify 单站点，`/menu` 和 `/kitchen` 双 PWA 入口
- 无登录：localStorage 设备绑定角色
- 无内置 LLM：菜谱录入、采购清单生成等"智能"任务都在 Claude Code 对话里完成

详见 `docs/specs/`。

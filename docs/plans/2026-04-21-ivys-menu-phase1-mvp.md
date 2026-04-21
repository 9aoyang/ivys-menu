# Ivy's Menu — Phase 1 (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the smallest working version of Ivy's Menu — Ivy can browse the menu, place a single order, go through the family credit card payment ritual, and see her order status. The chef can see today's orders and advance them through `placed → accepted → cooking → done`.

**Architecture:** Independent Next.js 15 (App Router) web app. Single Netlify deployment, single Supabase project. Two paths (`/menu`, `/kitchen`) each with their own PWA manifest so the user installs two separate app icons on the phone. No login — `localStorage.role` decides which side a device belongs to. No runtime LLM — all recipe content and purchase-list generation happens via Claude Code conversation and writes directly to Supabase.

**Tech Stack:** Next.js 15 (App Router, Server Actions), React 19, TypeScript 5, Tailwind CSS 4, Framer Motion 12, Supabase JS v2, Zod (input validation), Vitest (unit tests), @testing-library/react (component tests).

**Reference:** See spec at `docs/superpowers/specs/2026-04-21-ivys-menu-product-design.md` (in SkillQuest repo) for full product context. This plan assumes a **new repository** named `ivys-menu` at `/Users/gaoyang/Documents/github/ivys-menu/`.

**Phase 1 Scope (this plan):**

| Stage | What ships | Status at end |
|---|---|---|
| 0 — Project init | Empty Next.js + Tailwind 4 + Netlify + git | Blank page deployed |
| 1 — Supabase foundation | Schema + typed client + seed 2 recipes | DB queryable |
| 2 — Role selection + dual PWA | `/`, `/menu`, `/kitchen` routing + 2 manifests | Two app icons installable |
| 3 — Recipe library (chef) | `/kitchen/recipes` list + detail + cooking timeline | Chef can read recipes |
| 4 — Menu browsing (Ivy) | `/menu` menu grid with 3 meal-type tabs | Ivy can browse |
| 5 — Single order flow | `/menu/order-single` + `/menu/checkout` (family credit card) + `/menu/orders` | Ivy can order + pay + see status |
| 5b — Kitchen today view | `/kitchen` today-first view + order status advance | Chef can accept/cook/done |

**Explicit out of Phase 1** (will get a Phase 2 plan):
- Weekly batch pre-order (`/menu/order-week`)
- Menu admin page (`is_active` toggle + side binding)
- Purchase list view + prompt
- `/menu/card` card stats page
- `/kitchen/week` weekly order calendar

**Testing philosophy:**
- **Unit tests** — pure functions (price formatting, cooking timeline generator, role binding logic). TDD: tests first.
- **Component tests** — critical UI state (MenuGrid, OrderCard, PaymentScreen). TDD when feasible, may write some after implementation if animation-heavy.
- **No E2E** in Phase 1 — manual verification on real devices is faster at this stage.

---

## Stage 0 — Project Initialization

### Task 0.1: Create repository directory and Next.js project

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/*` (new project)

- [ ] **Step 1: Create parent directory and initialize Next.js**

Run this in a terminal outside any existing project:

```bash
cd /Users/gaoyang/Documents/github
npx create-next-app@latest ivys-menu \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --turbopack
```

When prompted, accept defaults. This creates `ivys-menu/` with Next.js 15 App Router, TypeScript, Tailwind 4, ESLint.

- [ ] **Step 2: Verify project runs**

```bash
cd /Users/gaoyang/Documents/github/ivys-menu
npm run dev
```

Expected: `Ready in Xms · Local: http://localhost:3000`. Visit the URL, see the default Next.js welcome page. Ctrl+C to stop.

- [ ] **Step 3: Commit initial scaffold**

```bash
cd /Users/gaoyang/Documents/github/ivys-menu
git add -A
git commit -m "chore: scaffold Next.js 15 + Tailwind 4 + TS"
```

---

### Task 0.2: Add runtime dependencies

**Files:**
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/package.json`

- [ ] **Step 1: Install runtime deps**

```bash
cd /Users/gaoyang/Documents/github/ivys-menu
npm install @supabase/supabase-js@latest framer-motion@latest zod@latest
```

- [ ] **Step 2: Install dev deps**

```bash
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom @types/node
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase, framer-motion, zod, vitest"
```

---

### Task 0.3: Configure Vitest for unit + component tests

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/vitest.config.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/tests/setup.ts`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/package.json` (scripts)

- [ ] **Step 1: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

- [ ] **Step 2: Create test setup**

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 3: Add test scripts to package.json**

In `package.json`, add to `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 4: Verify test runner works with trivial test**

Create `tests/sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('adds numbers', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: `1 passed`. Delete `tests/sanity.test.ts` after confirming.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts tests/setup.ts package.json package-lock.json
git commit -m "chore: configure vitest"
```

---

### Task 0.4: Set up env variable structure

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/.env.local.example`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/.gitignore`

- [ ] **Step 1: Create env example**

Create `.env.local.example`:

```
# Supabase (new project, not shared with SkillQuest)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Family credit card password (6-digit, set at first run)
FAMILY_CARD_PASSWORD=020202

# Supabase Storage bucket for cover images
NEXT_PUBLIC_COVER_BUCKET=recipe-covers
```

- [ ] **Step 2: Verify .gitignore already has .env.local**

```bash
grep -q "^.env" .gitignore && echo "OK" || echo "MISSING"
```

Expected: `OK`. If `MISSING`, append `.env*` to `.gitignore`.

- [ ] **Step 3: Commit**

```bash
git add .env.local.example .gitignore
git commit -m "chore: document env variables"
```

---

### Task 0.5: Connect to Netlify

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/netlify.toml`

- [ ] **Step 1: Create Netlify config**

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

- [ ] **Step 2: Push to new GitHub repo**

```bash
gh repo create silence1amb/ivys-menu --private --source=. --remote=origin --push
```

- [ ] **Step 3: Connect Netlify (one-time, via dashboard)**

In `https://app.netlify.com`:
1. New site from Git → select `silence1amb/ivys-menu`
2. Build command: `npm run build` (should auto-detect)
3. Publish directory: `.next` (auto)
4. Set env vars from `.env.local.example` — leave Supabase values blank for now, fill in after Stage 1
5. Deploy. Expect success even with empty env vars (Stage 2 pages don't hit Supabase yet).

- [ ] **Step 4: Verify deployment URL loads**

Visit the Netlify URL. Expected: default Next.js page. Note the URL for later.

- [ ] **Step 5: Commit**

```bash
git add netlify.toml
git commit -m "chore: configure Netlify build"
git push
```

---

## Stage 1 — Supabase Foundation

### Task 1.1: Create Supabase project + capture credentials

**Files:**
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/.env.local` (local only, not committed)

- [ ] **Step 1: Create a new Supabase project**

In `https://supabase.com/dashboard`:
1. New project → org: your personal org → name: `ivys-menu`
2. Set a strong DB password (save to 1Password or similar)
3. Region: closest to your location (East Asia `Singapore` if based in China)
4. Wait ~2 min for provisioning.

- [ ] **Step 2: Copy credentials to .env.local**

From Supabase dashboard → Settings → API:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key (keep secret!)
- `FAMILY_CARD_PASSWORD` = 6 digits of your chosen date (e.g., `020215`)

- [ ] **Step 3: Add env vars to Netlify**

Netlify dashboard → Site settings → Environment variables → paste all 4 from `.env.local`. Redeploy site.

---

### Task 1.2: Write schema migration (recipes, orders, order_sides, purchase_lists)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/supabase/migrations/0001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

Create the directory and file:

```bash
mkdir -p supabase/migrations
```

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
-- Ivy's Menu initial schema

-- Recipes: the full catalog of dishes
create table recipes (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  emoji               text not null,
  cover_image_url     text not null,
  short_desc          text not null,
  taste_tags          text[] not null default '{}',
  price               int not null check (price >= 0),

  role                text not null check (role in ('main', 'side')),
  meal_type           text not null check (meal_type in ('breakfast', 'dinner', 'weekend')),
  serving_default     int not null default 1 check (serving_default > 0),
  cook_time_min       int not null check (cook_time_min > 0),
  difficulty          text not null default 'normal' check (difficulty in ('easy', 'normal', 'hard')),

  ingredients         jsonb not null default '[]'::jsonb,
  steps               jsonb not null default '[]'::jsonb,
  tips                text,
  source_url          text,

  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index recipes_meal_type_role_idx on recipes (meal_type, role, is_active);

-- Orders: each meal ordered by Ivy
create table orders (
  id                  uuid primary key default gen_random_uuid(),
  main_recipe_id      uuid not null references recipes(id),
  serving             int not null default 1 check (serving > 0),
  meal_date           date not null,
  meal_type           text not null check (meal_type in ('breakfast', 'dinner', 'weekend')),

  status              text not null default 'placed'
                        check (status in ('placed', 'accepted', 'cooking', 'done', 'cancelled')),
  placed_at           timestamptz not null default now(),
  accepted_at         timestamptz,
  cooking_at          timestamptz,
  done_at             timestamptz,
  cancelled_at        timestamptz,

  paid_at             timestamptz not null default now(),
  price_snapshot      int not null check (price_snapshot >= 0),

  note                text
);

create index orders_meal_date_status_idx on orders (meal_date, status);

-- Order sides: chef's side-dish assignments for dinner orders
create table order_sides (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  side_recipe_id      uuid not null references recipes(id),
  assigned_at         timestamptz not null default now(),
  unique (order_id, side_recipe_id)
);

-- Purchase lists: generated weekly by Claude Code conversation
create table purchase_lists (
  id                  uuid primary key default gen_random_uuid(),
  week_start          date not null unique,
  items               jsonb not null default '[]'::jsonb,
  generated_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- updated_at trigger for recipes
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at
  before update on recipes
  for each row execute function set_updated_at();

create trigger purchase_lists_updated_at
  before update on purchase_lists
  for each row execute function set_updated_at();
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Supabase dashboard → SQL Editor → paste the full file content → Run.
Expected: 4 tables + 2 triggers + 1 function, no errors.

Verify:
```sql
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;
```
Expected rows: `order_sides`, `orders`, `purchase_lists`, `recipes`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/0001_initial_schema.sql
git commit -m "feat(db): initial schema — recipes, orders, order_sides, purchase_lists"
```

---

### Task 1.3: Create typed Supabase clients

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/supabase/types.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/supabase/client.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/supabase/server.ts`

- [ ] **Step 1: Create shared types**

Create `lib/supabase/types.ts`:

```typescript
export type MealType = 'breakfast' | 'dinner' | 'weekend';
export type RecipeRole = 'main' | 'side';
export type Difficulty = 'easy' | 'normal' | 'hard';
export type OrderStatus = 'placed' | 'accepted' | 'cooking' | 'done' | 'cancelled';
export type StepPhase = '备菜' | '主做' | '收尾';

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
  category: string;
}

export interface Step {
  content: string;
  duration_min: number;
  phase: StepPhase;
}

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  cover_image_url: string;
  short_desc: string;
  taste_tags: string[];
  price: number;

  role: RecipeRole;
  meal_type: MealType;
  serving_default: number;
  cook_time_min: number;
  difficulty: Difficulty;

  ingredients: Ingredient[];
  steps: Step[];
  tips: string | null;
  source_url: string | null;

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  main_recipe_id: string;
  serving: number;
  meal_date: string;
  meal_type: MealType;
  status: OrderStatus;
  placed_at: string;
  accepted_at: string | null;
  cooking_at: string | null;
  done_at: string | null;
  cancelled_at: string | null;
  paid_at: string;
  price_snapshot: number;
  note: string | null;
}

export interface OrderSide {
  id: string;
  order_id: string;
  side_recipe_id: string;
  assigned_at: string;
}
```

- [ ] **Step 2: Create browser client**

Create `lib/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseBrowser = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key);
};
```

- [ ] **Step 3: Create server client (service role for privileged reads/writes)**

Create `lib/supabase/server.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabaseServer = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase server env vars');
  return createClient(url, key, { auth: { persistSession: false } });
};
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat(db): typed supabase clients"
```

---

### Task 1.4: Seed 2 starter recipes via Claude Code conversation

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/scripts/seed-recipes.ts`

- [ ] **Step 1: Create seed script**

Create `scripts/seed-recipes.ts`:

```typescript
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const RECIPES = [
  {
    name: '奶油蘑菇汤',
    emoji: '🍲',
    cover_image_url: 'https://placehold.co/800x800/ec4899/fff?text=奶油蘑菇汤',
    short_desc: '奶香浓郁，阴冷天的拥抱',
    taste_tags: ['咸鲜', '暖'],
    price: 42,
    role: 'main',
    meal_type: 'dinner',
    serving_default: 2,
    cook_time_min: 35,
    difficulty: 'normal',
    ingredients: [
      { name: '蘑菇', amount: 300, unit: 'g', category: '蔬菜' },
      { name: '黄油', amount: 40, unit: 'g', category: '调料' },
      { name: '洋葱', amount: 1, unit: '个', category: '蔬菜' },
      { name: '淡奶油', amount: 200, unit: 'ml', category: '乳制品' },
      { name: '高汤', amount: 500, unit: 'ml', category: '汤底' },
    ],
    steps: [
      { content: '蘑菇洗净切片，洋葱切末', duration_min: 5, phase: '备菜' },
      { content: '黄油融化，煸炒洋葱至半透明', duration_min: 5, phase: '主做' },
      { content: '下蘑菇炒至出水，加高汤和淡奶油', duration_min: 20, phase: '主做' },
      { content: '调味、盛碗、撒欧芹', duration_min: 5, phase: '收尾' },
    ],
    tips: '蘑菇要用干毛巾擦，不要水洗，否则出水严重',
    source_url: null,
    is_active: true,
  },
  {
    name: '黄油芦笋',
    emoji: '🥦',
    cover_image_url: 'https://placehold.co/800x800/10b981/fff?text=黄油芦笋',
    short_desc: '春日限定 · 清脆微甜',
    taste_tags: ['清爽', '春'],
    price: 28,
    role: 'side',
    meal_type: 'dinner',
    serving_default: 2,
    cook_time_min: 10,
    difficulty: 'easy',
    ingredients: [
      { name: '芦笋', amount: 400, unit: 'g', category: '蔬菜' },
      { name: '黄油', amount: 20, unit: 'g', category: '调料' },
      { name: '盐', amount: 2, unit: 'g', category: '调料' },
    ],
    steps: [
      { content: '芦笋切掉老根，切段', duration_min: 3, phase: '备菜' },
      { content: '黄油融化，煎芦笋至微焦', duration_min: 5, phase: '主做' },
      { content: '盐调味，装盘', duration_min: 2, phase: '收尾' },
    ],
    tips: '火要大，让黄油焦化出坚果香',
    source_url: null,
    is_active: true,
  },
];

async function main() {
  for (const r of RECIPES) {
    const { error } = await sb.from('recipes').insert(r);
    if (error) {
      console.error('❌', r.name, error.message);
      process.exit(1);
    }
    console.log('✅ 已录入', r.name);
  }
}

main();
```

- [ ] **Step 2: Install dotenv-cli for seed**

```bash
npm install -D dotenv tsx
```

- [ ] **Step 3: Add seed script to package.json**

In `package.json` `scripts`:

```json
"seed": "tsx scripts/seed-recipes.ts"
```

- [ ] **Step 4: Run seed**

```bash
npm run seed
```

Expected: `✅ 已录入 奶油蘑菇汤` and `✅ 已录入 黄油芦笋`.

- [ ] **Step 5: Verify via SQL editor**

```sql
select name, meal_type, role, price from recipes;
```
Expected: 2 rows.

- [ ] **Step 6: Commit**

```bash
git add scripts/seed-recipes.ts package.json package-lock.json
git commit -m "feat(seed): 2 starter recipes (奶油蘑菇汤, 黄油芦笋)"
```

---

### Task 1.5: Write unit test for cooking timeline generator (pure function)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/cooking/timeline.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/cooking/timeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/cooking/timeline.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildCookingTimeline } from './timeline';
import type { Step } from '@/lib/supabase/types';

describe('buildCookingTimeline', () => {
  const steps: Step[] = [
    { content: '洗菜', duration_min: 5, phase: '备菜' },
    { content: '煸炒', duration_min: 10, phase: '主做' },
    { content: '装盘', duration_min: 2, phase: '收尾' },
  ];

  it('sums step durations', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    expect(result.totalDurationMin).toBe(17);
  });

  it('computes start time by subtracting total from end time', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    // 19:00 - 17 min = 18:43
    expect(result.startAt.toISOString()).toBe('2026-04-21T10:43:00.000Z');
    // note: +08:00 means 10:43 UTC == 18:43 local
  });

  it('assigns absolute times to each step', () => {
    const result = buildCookingTimeline(steps, new Date('2026-04-21T19:00:00+08:00'));
    expect(result.scheduled).toHaveLength(3);
    expect(result.scheduled[0].startAt.toISOString()).toBe('2026-04-21T10:43:00.000Z');
    expect(result.scheduled[1].startAt.toISOString()).toBe('2026-04-21T10:48:00.000Z');
    expect(result.scheduled[2].startAt.toISOString()).toBe('2026-04-21T10:58:00.000Z');
  });

  it('handles empty steps gracefully', () => {
    const result = buildCookingTimeline([], new Date('2026-04-21T19:00:00+08:00'));
    expect(result.totalDurationMin).toBe(0);
    expect(result.scheduled).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

```bash
npm test lib/cooking/timeline.test.ts
```
Expected: `Cannot find module './timeline'` or similar — fails because the module doesn't exist.

- [ ] **Step 3: Write minimal implementation**

Create `lib/cooking/timeline.ts`:

```typescript
import type { Step } from '@/lib/supabase/types';

export interface ScheduledStep extends Step {
  startAt: Date;
}

export interface CookingTimeline {
  totalDurationMin: number;
  startAt: Date;
  scheduled: ScheduledStep[];
}

export function buildCookingTimeline(steps: Step[], endAt: Date): CookingTimeline {
  const totalDurationMin = steps.reduce((acc, s) => acc + s.duration_min, 0);
  const startAt = new Date(endAt.getTime() - totalDurationMin * 60 * 1000);

  const scheduled: ScheduledStep[] = [];
  let cursor = startAt.getTime();
  for (const s of steps) {
    scheduled.push({ ...s, startAt: new Date(cursor) });
    cursor += s.duration_min * 60 * 1000;
  }

  return { totalDurationMin, startAt, scheduled };
}
```

- [ ] **Step 4: Run tests, confirm passing**

```bash
npm test lib/cooking/timeline.test.ts
```
Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/cooking/
git commit -m "feat(cooking): timeline generator + tests"
```

---

## Stage 2 — Role Selection & Dual PWA Manifests

### Task 2.1: Role binding logic (localStorage, typed)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/role/index.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/role/index.test.ts`

- [ ] **Step 1: Write failing test**

Create `lib/role/index.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getRole, setRole, clearRole, type Role } from './index';

describe('role binding', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no role set', () => {
    expect(getRole()).toBeNull();
  });

  it('persists role', () => {
    setRole('ivy');
    expect(getRole()).toBe('ivy');
  });

  it('overwrites previous role', () => {
    setRole('ivy');
    setRole('chef');
    expect(getRole()).toBe('chef');
  });

  it('clears role', () => {
    setRole('ivy');
    clearRole();
    expect(getRole()).toBeNull();
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('ivys-menu:role', 'stranger');
    expect(getRole()).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
npm test lib/role/index.test.ts
```
Expected: failure due to missing module.

- [ ] **Step 3: Implement**

Create `lib/role/index.ts`:

```typescript
export type Role = 'ivy' | 'chef';

const KEY = 'ivys-menu:role';

function isValidRole(v: unknown): v is Role {
  return v === 'ivy' || v === 'chef';
}

export function getRole(): Role | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  return isValidRole(raw) ? raw : null;
}

export function setRole(role: Role): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, role);
}

export function clearRole(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
```

- [ ] **Step 4: Run, confirm pass**

```bash
npm test lib/role/index.test.ts
```
Expected: `5 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/role/
git commit -m "feat(role): localStorage role binding"
```

---

### Task 2.2: Landing page `/` with role picker

**Files:**
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/page.tsx`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/layout.tsx`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/globals.css`

- [ ] **Step 1: Replace default landing page**

Overwrite `app/page.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getRole, setRole, type Role } from '@/lib/role';

export default function Landing() {
  const router = useRouter();

  useEffect(() => {
    const r = getRole();
    if (r === 'ivy') router.replace('/menu');
    else if (r === 'chef') router.replace('/kitchen');
  }, [router]);

  const pick = (r: Role) => {
    setRole(r);
    router.replace(r === 'ivy' ? '/menu' : '/kitchen');
  };

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center gap-10 bg-black text-white p-6">
      <div className="text-center">
        <h1 className="text-4xl font-serif tracking-wide mb-2">Ivy's Menu</h1>
        <p className="text-zinc-400 text-sm">家庭私人餐厅 · 请选择您的身份</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button
          onClick={() => pick('ivy')}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          🍽️ 我是 Ivy
        </button>
        <button
          onClick={() => pick('chef')}
          className="w-full py-5 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 font-semibold text-lg shadow-xl active:scale-[0.98] transition-transform"
        >
          👨‍🍳 我是主厨
        </button>
      </div>
      <p className="text-xs text-zinc-500 max-w-xs text-center">
        选定后记住本设备 · 换设备时重新选择
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Update root layout metadata**

Overwrite `app/layout.tsx` (keep default imports):

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Ivy's Menu",
  description: '家庭私人餐厅',
  themeColor: '#000000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-black text-white antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify in dev server**

```bash
npm run dev
```
Open `http://localhost:3000`. Expected: 2 big buttons. Click one — navigates to `/menu` or `/kitchen` (404 for now, that's OK). Refresh — does NOT show picker again; redirects directly.

Manually clear to reset: DevTools → Application → Local Storage → remove `ivys-menu:role`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/layout.tsx
git commit -m "feat(ui): landing page with role picker"
```

---

### Task 2.3: Create `/menu` and `/kitchen` route scaffolds with per-path manifests

**Note on manifests:** Next.js App Router's `manifest.ts` file convention only works at the app root. For per-path manifests we serve static JSON from `public/` at known URLs (`/menu/manifest.json`, `/kitchen/manifest.json`).

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/layout.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/public/menu/manifest.json`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/layout.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/public/kitchen/manifest.json`

- [ ] **Step 1: Create Ivy side scaffold**

Create `app/menu/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Ivy's Menu · 餐厅",
  manifest: '/menu/manifest.json',
  themeColor: '#ec4899',
  appleWebApp: {
    capable: true,
    title: "Ivy's Menu",
    statusBarStyle: 'black-translucent',
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-black">{children}</div>;
}
```

Create `app/menu/page.tsx`:

```tsx
export default function MenuHome() {
  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl font-serif">Ivy's Menu (wip)</h1>
      <p className="text-zinc-400 mt-2">菜单建设中</p>
    </main>
  );
}
```

Create `public/menu/manifest.json`:

```json
{
  "name": "Ivy's Menu",
  "short_name": "Ivy's Menu",
  "description": "家庭私人餐厅 · 顾客端",
  "start_url": "/menu",
  "scope": "/menu",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#ec4899",
  "icons": [
    { "src": "/icons/ivy-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/ivy-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 2: Create Chef side scaffold**

Create `app/kitchen/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '后厨 Kitchen',
  manifest: '/kitchen/manifest.json',
  themeColor: '#7c3aed',
  appleWebApp: {
    capable: true,
    title: '后厨',
    statusBarStyle: 'black-translucent',
  },
};

export default function KitchenLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-[100dvh] bg-black">{children}</div>;
}
```

Create `app/kitchen/page.tsx`:

```tsx
export default function KitchenHome() {
  return (
    <main className="p-8 text-white">
      <h1 className="text-2xl font-sans">👨‍🍳 后厨 (wip)</h1>
      <p className="text-zinc-400 mt-2">厨房视图建设中</p>
    </main>
  );
}
```

Create `public/kitchen/manifest.json`:

```json
{
  "name": "后厨 Kitchen",
  "short_name": "后厨",
  "description": "Ivy Menu 厨房端",
  "start_url": "/kitchen",
  "scope": "/kitchen",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#7c3aed",
  "icons": [
    { "src": "/icons/chef-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/chef-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

- [ ] **Step 3: Add placeholder icons**

```bash
mkdir -p public/icons
# Placeholder — replace with real designs later
curl -o public/icons/ivy-192.png "https://placehold.co/192x192/ec4899/fff?text=🍽"
curl -o public/icons/ivy-512.png "https://placehold.co/512x512/ec4899/fff?text=🍽"
curl -o public/icons/chef-192.png "https://placehold.co/192x192/7c3aed/fff?text=👨‍🍳"
curl -o public/icons/chef-512.png "https://placehold.co/512x512/7c3aed/fff?text=👨‍🍳"
```

- [ ] **Step 4: Verify in browser**

Run `npm run dev`. Visit:
- `http://localhost:3000/menu/manifest.json` — expected JSON with name "Ivy's Menu"
- `http://localhost:3000/kitchen/manifest.json` — expected JSON with name "后厨 Kitchen"
- `http://localhost:3000/menu` — expected "Ivy's Menu (wip)" page
- `http://localhost:3000/kitchen` — expected "后厨 (wip)" page

- [ ] **Step 5: Commit**

```bash
git add app/menu app/kitchen public/icons
git commit -m "feat(ui): dual PWA manifests + route scaffolds"
```

---

### Task 2.4: Role guard middleware

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/RoleGuard.tsx`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/layout.tsx`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/layout.tsx`

- [ ] **Step 1: Create client-side guard**

Create `components/RoleGuard.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getRole, type Role } from '@/lib/role';

export default function RoleGuard({ require, children }: { require: Role; children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const current = getRole();
    if (current !== require) {
      router.replace('/');
    } else {
      setOk(true);
    }
  }, [require, router]);

  if (!ok) return <div className="min-h-[100dvh] bg-black" />;
  return <>{children}</>;
}
```

- [ ] **Step 2: Wrap layouts**

Modify `app/menu/layout.tsx` — keep metadata export and wrap children:

```tsx
import type { Metadata } from 'next';
import RoleGuard from '@/components/RoleGuard';

export const metadata: Metadata = {
  title: "Ivy's Menu · 餐厅",
  manifest: '/menu/manifest.json',
  themeColor: '#ec4899',
  appleWebApp: {
    capable: true,
    title: "Ivy's Menu",
    statusBarStyle: 'black-translucent',
  },
};

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-black">
      <RoleGuard require="ivy">{children}</RoleGuard>
    </div>
  );
}
```

Modify `app/kitchen/layout.tsx` similarly with `require="chef"`.

- [ ] **Step 3: Verify guard**

Run `npm run dev`. In DevTools console:
```js
localStorage.setItem('ivys-menu:role', 'ivy');
location.href = '/kitchen';
```
Expected: redirects to `/`.

```js
localStorage.setItem('ivys-menu:role', 'chef');
location.href = '/kitchen';
```
Expected: stays on `/kitchen`, shows "后厨 (wip)".

- [ ] **Step 4: Commit**

```bash
git add components/RoleGuard.tsx app/menu/layout.tsx app/kitchen/layout.tsx
git commit -m "feat(role): client-side role guard for routes"
```

---

## Stage 3 — Recipe Library (Chef Side)

### Task 3.1: Recipe data access layer

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/data/recipes.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/data/recipes.test.ts`

- [ ] **Step 1: Write tests first (integration against real DB)**

Create `lib/data/recipes.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { fetchRecipesByMealType, fetchRecipeById } from './recipes';

describe('recipes data access', () => {
  it('fetches dinner mains (should include 奶油蘑菇汤 from seed)', async () => {
    const rows = await fetchRecipesByMealType('dinner', 'main');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.name === '奶油蘑菇汤')).toBe(true);
  });

  it('fetches dinner sides (should include 黄油芦笋 from seed)', async () => {
    const rows = await fetchRecipesByMealType('dinner', 'side');
    expect(rows.some((r) => r.name === '黄油芦笋')).toBe(true);
  });

  it('returns single recipe by id', async () => {
    const all = await fetchRecipesByMealType('dinner', 'main');
    const first = all[0];
    const got = await fetchRecipeById(first.id);
    expect(got?.name).toBe(first.name);
  });

  it('returns null for unknown id', async () => {
    const got = await fetchRecipeById('00000000-0000-0000-0000-000000000000');
    expect(got).toBeNull();
  });
});
```

- [ ] **Step 2: Run, confirm fails**

```bash
npm test lib/data/recipes.test.ts
```
Expected: module not found.

- [ ] **Step 3: Implement**

Create `lib/data/recipes.ts`:

```typescript
import { supabaseServer } from '@/lib/supabase/server';
import type { Recipe, MealType, RecipeRole } from '@/lib/supabase/types';

export async function fetchRecipesByMealType(
  mealType: MealType,
  role: RecipeRole,
  onlyActive = true,
): Promise<Recipe[]> {
  const sb = supabaseServer();
  let q = sb.from('recipes').select('*').eq('meal_type', mealType).eq('role', role);
  if (onlyActive) q = q.eq('is_active', true);
  const { data, error } = await q.order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Recipe[];
}

export async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const sb = supabaseServer();
  const { data, error } = await sb.from('recipes').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Recipe | null) ?? null;
}

export async function fetchAllRecipes(): Promise<Recipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb.from('recipes').select('*').order('meal_type').order('role').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []) as Recipe[];
}
```

- [ ] **Step 4: Add test script that loads env**

Modify `package.json` scripts:

```json
"test": "vitest run --env-file=.env.local"
```

If Vitest version doesn't support `--env-file`, use dotenv-cli:

```json
"test": "dotenv -e .env.local -- vitest run"
```

- [ ] **Step 5: Run, confirm pass**

```bash
npm test lib/data/recipes.test.ts
```
Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add lib/data/ package.json
git commit -m "feat(data): recipes query layer + integration tests"
```

---

### Task 3.2: Recipe list page `/kitchen/recipes`

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/recipes/page.tsx`

- [ ] **Step 1: Create server component page**

Create `app/kitchen/recipes/page.tsx`:

```tsx
import Link from 'next/link';
import { fetchAllRecipes } from '@/lib/data/recipes';

export const dynamic = 'force-dynamic';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '🍳 早餐',
  dinner: '🍲 晚餐',
  weekend: '🏖️ 周末',
};

export default async function RecipesPage() {
  const recipes = await fetchAllRecipes();
  const byMeal = recipes.reduce<Record<string, typeof recipes>>((acc, r) => {
    (acc[r.meal_type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <main className="p-6 text-white max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/kitchen" className="text-xs text-zinc-500 hover:text-zinc-300">← 回厨房</Link>
        <h1 className="text-2xl font-semibold mt-2">菜谱库</h1>
        <p className="text-sm text-zinc-500 mt-1">共 {recipes.length} 道菜</p>
      </div>

      {(['breakfast', 'dinner', 'weekend'] as const).map((mt) => {
        const list = byMeal[mt] ?? [];
        if (list.length === 0) return null;
        return (
          <section key={mt} className="mb-8">
            <h2 className="text-sm text-zinc-400 tracking-widest mb-3">{MEAL_LABELS[mt]} · {list.length}</h2>
            <ul className="space-y-2">
              {list.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/kitchen/recipes/${r.id}`}
                    className="flex gap-3 p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-2xl flex-shrink-0">
                      {r.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-zinc-500 truncate">{r.short_desc}</div>
                    </div>
                    <div className="text-xs text-zinc-500 self-center whitespace-nowrap">
                      {r.cook_time_min} min · {r.role === 'main' ? '主菜' : '配菜'}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {recipes.length === 0 && (
        <div className="text-center text-zinc-500 py-20">
          <p>还没有菜谱</p>
          <p className="text-xs mt-2">通过 Claude Code 对话录入</p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Verify in browser**

Run `npm run dev`. Set chef role in console: `localStorage.setItem('ivys-menu:role', 'chef')`. Visit `http://localhost:3000/kitchen/recipes`.
Expected: Shows 2 recipes (奶油蘑菇汤 under 🍲 晚餐 · 主菜 section, 黄油芦笋 under 🍲 晚餐 · side).

Actually both are under "dinner" — they should appear in the same section. The current grouping is by meal_type only, so both appear under "🍲 晚餐". That's correct.

- [ ] **Step 3: Commit**

```bash
git add app/kitchen/recipes/page.tsx
git commit -m "feat(kitchen): recipe list page"
```

---

### Task 3.3: Recipe detail page with cooking timeline

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/recipes/[id]/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/CookingTimeline.tsx`

- [ ] **Step 1: Create timeline component**

Create `components/CookingTimeline.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { buildCookingTimeline } from '@/lib/cooking/timeline';
import type { Step } from '@/lib/supabase/types';

export default function CookingTimeline({ steps }: { steps: Step[] }) {
  // Default target end time: today 19:00 local
  const defaultEnd = useMemo(() => {
    const d = new Date();
    d.setHours(19, 0, 0, 0);
    return d;
  }, []);

  const [endIso, setEndIso] = useState(() => toLocalInputValue(defaultEnd));
  const end = new Date(endIso);
  const tl = buildCookingTimeline(steps, end);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-zinc-400">
          总耗时 <span className="text-white font-semibold">{tl.totalDurationMin}</span> min
        </div>
        <label className="text-xs text-zinc-500 flex items-center gap-2">
          出餐时间
          <input
            type="datetime-local"
            value={endIso}
            onChange={(e) => setEndIso(e.target.value)}
            className="bg-zinc-900 text-white text-xs px-2 py-1 rounded border border-zinc-700"
          />
        </label>
      </div>

      <div className="relative pl-5">
        <div className="absolute left-1 top-3 bottom-3 w-0.5 bg-zinc-800" />
        {tl.scheduled.map((s, i) => (
          <div key={i} className="relative mb-4">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-violet-500 border-2 border-black" />
            <div className="text-xs text-zinc-500">
              {formatTime(s.startAt)} · {s.phase} · {s.duration_min} min
            </div>
            <div className="text-sm mt-0.5">{s.content}</div>
          </div>
        ))}
        {tl.scheduled.length > 0 && (
          <div className="relative">
            <div className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-black" />
            <div className="text-xs text-green-400">
              {formatTime(end)} · ✓ 出餐
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
```

- [ ] **Step 2: Create detail page**

Create `app/kitchen/recipes/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { fetchRecipeById } from '@/lib/data/recipes';
import CookingTimeline from '@/components/CookingTimeline';

export const dynamic = 'force-dynamic';

export default async function RecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await fetchRecipeById(id);
  if (!recipe) notFound();

  return (
    <main className="p-6 text-white max-w-2xl mx-auto">
      <Link href="/kitchen/recipes" className="text-xs text-zinc-500 hover:text-zinc-300">← 回菜谱库</Link>

      <div className="mt-4 relative aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-900">
        <Image src={recipe.cover_image_url} alt={recipe.name} fill className="object-cover" unoptimized />
      </div>

      <div className="mt-5">
        <h1 className="text-3xl font-serif">{recipe.emoji} {recipe.name}</h1>
        <p className="text-sm text-zinc-400 mt-1 italic">{recipe.short_desc}</p>
        <div className="flex gap-2 mt-3 flex-wrap">
          {recipe.taste_tags.map((t) => (
            <span key={t} className="text-xs px-2 py-1 bg-zinc-900 rounded-full text-zinc-400">{t}</span>
          ))}
          <span className="text-xs px-2 py-1 bg-violet-900/40 rounded-full text-violet-300">
            ¥ {recipe.price} · {recipe.cook_time_min} min · {recipe.difficulty}
          </span>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="text-sm tracking-widest text-zinc-400 mb-3">食材</h2>
        <ul className="space-y-1 text-sm">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex justify-between border-b border-zinc-900 pb-1">
              <span>{ing.name} <span className="text-zinc-600 text-xs">· {ing.category}</span></span>
              <span className="text-zinc-400 font-mono">{ing.amount} {ing.unit}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm tracking-widest text-zinc-400 mb-3">烹饪时间线</h2>
        <CookingTimeline steps={recipe.steps} />
      </section>

      {recipe.tips && (
        <section className="mt-8 p-4 bg-amber-950/30 border border-amber-900/50 rounded-xl">
          <div className="text-xs text-amber-500 tracking-widest mb-1">TIPS</div>
          <p className="text-sm text-amber-100">{recipe.tips}</p>
        </section>
      )}

      {recipe.source_url && (
        <p className="mt-6 text-xs text-zinc-500">
          来源：<a href={recipe.source_url} className="underline" target="_blank" rel="noreferrer">{recipe.source_url}</a>
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Configure next.config for placehold.co**

Check if `next.config.ts` exists; if so, modify it. Otherwise create:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Verify**

`npm run dev`. Click a recipe from `/kitchen/recipes`. Expected: cover + ingredients list + cooking timeline with time picker that updates times reactively.

- [ ] **Step 5: Commit**

```bash
git add app/kitchen/recipes components/CookingTimeline.tsx next.config.ts
git commit -m "feat(kitchen): recipe detail page with cooking timeline"
```

---

## Stage 4 — Menu Browsing (Ivy Side)

### Task 4.1: Menu page with meal-type tabs and high-saturation grid

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/MenuGrid.tsx`
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/page.tsx`

- [ ] **Step 1: Create grid component**

Create `components/MenuGrid.tsx`:

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { Recipe } from '@/lib/supabase/types';

export default function MenuGrid({ recipes }: { recipes: Recipe[] }) {
  if (recipes.length === 0) {
    return <div className="text-zinc-500 text-center py-16 text-sm">暂无菜品</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {recipes.map((r) => (
        <Link
          key={r.id}
          href={`/menu/order-single?recipe=${r.id}`}
          className="aspect-square rounded-2xl overflow-hidden relative bg-zinc-900 active:scale-[0.98] transition-transform"
        >
          <Image src={r.cover_image_url} alt={r.name} fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div className="text-lg">{r.emoji}</div>
            <div className="font-semibold text-sm leading-tight mt-0.5">{r.name}</div>
            <div className="text-xs text-zinc-300 mt-0.5 line-clamp-1">{r.short_desc}</div>
            <div className="text-xs text-pink-300 mt-1 font-mono">¥ {r.price}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Update menu page with tabs**

Overwrite `app/menu/page.tsx`:

```tsx
import { fetchRecipesByMealType } from '@/lib/data/recipes';
import MenuTabsClient from './MenuTabsClient';

export const dynamic = 'force-dynamic';

export default async function MenuHome() {
  const [breakfast, dinnerMain, weekend] = await Promise.all([
    fetchRecipesByMealType('breakfast', 'main'),
    fetchRecipesByMealType('dinner', 'main'),
    fetchRecipesByMealType('weekend', 'main'),
  ]);

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      <header className="p-5 pb-3">
        <div className="text-xs text-pink-400 tracking-widest">TONIGHT'S MENU</div>
        <h1 className="text-2xl font-serif mt-1">Ivy's Menu</h1>
      </header>
      <MenuTabsClient
        breakfast={breakfast}
        dinner={dinnerMain}
        weekend={weekend}
      />
    </main>
  );
}
```

- [ ] **Step 3: Create client tabs component**

Create `app/menu/MenuTabsClient.tsx`:

```tsx
'use client';

import { useState } from 'react';
import MenuGrid from '@/components/MenuGrid';
import type { Recipe } from '@/lib/supabase/types';

type Tab = 'breakfast' | 'dinner' | 'weekend';

const LABELS: Record<Tab, string> = {
  breakfast: '🍳 早餐',
  dinner: '🍲 晚餐',
  weekend: '🏖️ 周末',
};

export default function MenuTabsClient({
  breakfast,
  dinner,
  weekend,
}: {
  breakfast: Recipe[];
  dinner: Recipe[];
  weekend: Recipe[];
}) {
  const [tab, setTab] = useState<Tab>('dinner');
  const data = { breakfast, dinner, weekend }[tab];

  return (
    <div className="px-4">
      <div className="flex gap-2 mb-4">
        {(Object.keys(LABELS) as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
              tab === t ? 'bg-pink-600 text-white' : 'bg-zinc-900 text-zinc-400'
            }`}
          >
            {LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'dinner' && (
        <div className="mb-4 p-3 bg-zinc-900 rounded-xl text-xs text-zinc-400 text-center">
          ♡ 主厨将为您搭配两道当季时蔬
        </div>
      )}

      <MenuGrid recipes={data} />
    </div>
  );
}
```

- [ ] **Step 4: Verify**

Set `localStorage.ivys-menu:role = 'ivy'`. Visit `http://localhost:3000/menu`. Expected: header + 3 tabs + dinner tab selected by default showing 奶油蘑菇汤 card in 2-col grid with black-to-image gradient.

- [ ] **Step 5: Commit**

```bash
git add app/menu/ components/MenuGrid.tsx
git commit -m "feat(menu): menu grid with meal-type tabs"
```

---

## Stage 5 — Single Order Flow

### Task 5.1: Checkout store (in-memory order draft)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/checkout/draft.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/checkout/draft.test.ts`

- [ ] **Step 1: Write tests**

Create `lib/checkout/draft.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { setDraft, getDraft, clearDraft, totalPrice } from './draft';

beforeEach(() => sessionStorage.clear());

describe('checkout draft', () => {
  it('stores a single-item draft', () => {
    setDraft({
      items: [{ recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 }],
    });
    const d = getDraft();
    expect(d?.items).toHaveLength(1);
    expect(d?.items[0].price_snapshot).toBe(42);
  });

  it('totalPrice sums price_snapshot across items', () => {
    setDraft({
      items: [
        { recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 },
        { recipe_id: 'r2', serving: 1, meal_date: '2026-04-23', meal_type: 'breakfast', price_snapshot: 28 },
      ],
    });
    expect(totalPrice(getDraft()!)).toBe(70);
  });

  it('clearDraft removes storage', () => {
    setDraft({ items: [{ recipe_id: 'r1', serving: 1, meal_date: '2026-04-22', meal_type: 'dinner', price_snapshot: 42 }] });
    clearDraft();
    expect(getDraft()).toBeNull();
  });
});
```

- [ ] **Step 2: Run, fails**

```bash
npm test lib/checkout/draft.test.ts
```

- [ ] **Step 3: Implement**

Create `lib/checkout/draft.ts`:

```typescript
import type { MealType } from '@/lib/supabase/types';

export interface DraftItem {
  recipe_id: string;
  serving: number;
  meal_date: string;   // YYYY-MM-DD
  meal_type: MealType;
  price_snapshot: number;
}

export interface CheckoutDraft {
  items: DraftItem[];
}

const KEY = 'ivys-menu:checkout-draft';

export function setDraft(d: CheckoutDraft) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(d));
}

export function getDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return null;
  }
}

export function clearDraft() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(KEY);
}

export function totalPrice(d: CheckoutDraft): number {
  return d.items.reduce((acc, i) => acc + i.price_snapshot * i.serving, 0);
}
```

- [ ] **Step 4: Tests pass**

```bash
npm test lib/checkout/draft.test.ts
```
Expected: `3 passed`.

- [ ] **Step 5: Commit**

```bash
git add lib/checkout/
git commit -m "feat(checkout): draft store (sessionStorage)"
```

---

### Task 5.2: Single order page `/menu/order-single`

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/order-single/page.tsx`

- [ ] **Step 1: Implement page**

Create `app/menu/order-single/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { setDraft } from '@/lib/checkout/draft';
import type { Recipe } from '@/lib/supabase/types';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function OrderSinglePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const recipeId = sp.get('recipe');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [serving, setServing] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!recipeId) { router.replace('/menu'); return; }
    const sb = supabaseBrowser();
    sb.from('recipes').select('*').eq('id', recipeId).maybeSingle()
      .then(({ data }) => {
        setRecipe(data as Recipe | null);
        if (data) setServing((data as Recipe).serving_default);
        setLoading(false);
      });
  }, [recipeId, router]);

  if (loading) return <div className="p-8 text-zinc-500">加载中...</div>;
  if (!recipe) return <div className="p-8 text-zinc-500">未找到菜品</div>;

  const onCheckout = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setDraft({
      items: [{
        recipe_id: recipe.id,
        serving,
        meal_date: `${yyyy}-${mm}-${dd}`,
        meal_type: recipe.meal_type,
        price_snapshot: recipe.price,
      }],
    });
    router.push('/menu/checkout');
  };

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="text-xs text-zinc-500">← 回菜单</button>

      <div className="mt-4 relative aspect-square rounded-2xl overflow-hidden bg-zinc-900">
        <Image src={recipe.cover_image_url} alt={recipe.name} fill className="object-cover" unoptimized />
      </div>

      <div className="mt-5">
        <h1 className="text-2xl font-serif">{recipe.emoji} {recipe.name}</h1>
        <p className="text-sm text-zinc-400 italic mt-1">{recipe.short_desc}</p>
        <div className="mt-2 text-lg text-pink-400 font-mono">¥ {recipe.price}</div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <span className="text-sm text-zinc-400">份数</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setServing(Math.max(1, serving - 1))}
            className="w-9 h-9 rounded-full bg-zinc-800 text-xl active:scale-95"
          >−</button>
          <div className="w-8 text-center font-mono">{serving}</div>
          <button
            onClick={() => setServing(serving + 1)}
            className="w-9 h-9 rounded-full bg-zinc-800 text-xl active:scale-95"
          >+</button>
        </div>
      </div>

      <button
        onClick={onCheckout}
        className="mt-10 w-full py-4 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 font-semibold text-lg active:scale-[0.98] shadow-xl"
      >
        确认下单 · ¥ {recipe.price * serving}
      </button>
    </main>
  );
}
```

- [ ] **Step 2: Verify**

On `/menu`, click a dish. Expected: single-order page with image, title, quantity stepper, and a "确认下单" button showing live total.

- [ ] **Step 3: Commit**

```bash
git add app/menu/order-single
git commit -m "feat(menu): single-order page with quantity stepper"
```

---

### Task 5.3: API route `/api/orders/create` (server-authoritative, password-gated)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/api/orders/create/route.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/api/orders.ts`

- [ ] **Step 1: Create shared schema**

Create `lib/api/orders.ts`:

```typescript
import { z } from 'zod';

export const CreateOrdersInput = z.object({
  password: z.string().length(6),
  items: z.array(z.object({
    recipe_id: z.string().uuid(),
    serving: z.number().int().min(1),
    meal_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    meal_type: z.enum(['breakfast', 'dinner', 'weekend']),
    price_snapshot: z.number().int().min(0),
    note: z.string().optional(),
  })).min(1),
});

export type CreateOrdersPayload = z.infer<typeof CreateOrdersInput>;
```

- [ ] **Step 2: Create API route**

Create `app/api/orders/create/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { CreateOrdersInput } from '@/lib/api/orders';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = CreateOrdersInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { password, items } = parsed.data;

  if (password !== process.env.FAMILY_CARD_PASSWORD) {
    return NextResponse.json({ error: 'wrong_password' }, { status: 401 });
  }

  const sb = supabaseServer();
  const now = new Date().toISOString();
  const rows = items.map((i) => ({
    main_recipe_id: i.recipe_id,
    serving: i.serving,
    meal_date: i.meal_date,
    meal_type: i.meal_type,
    price_snapshot: i.price_snapshot,
    note: i.note ?? null,
    paid_at: now,
    status: 'placed' as const,
  }));

  const { data, error } = await sb.from('orders').insert(rows).select('id');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ order_ids: data.map((r) => r.id) });
}
```

- [ ] **Step 3: Quick smoke test**

Run dev server. In DevTools console:
```js
fetch('/api/orders/create', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    password: 'wrong',
    items: [{ recipe_id: '00000000-0000-0000-0000-000000000000', serving: 1, meal_date: '2026-04-21', meal_type: 'dinner', price_snapshot: 42 }],
  }),
}).then(r => r.status);
```
Expected: `401`.

Try with correct password and a real recipe_id (copy from `/kitchen/recipes`) — expected `200` with order_ids. Verify in Supabase SQL: `select * from orders order by placed_at desc limit 1;`.

- [ ] **Step 4: Commit**

```bash
git add app/api/orders/create lib/api/orders.ts
git commit -m "feat(api): orders/create endpoint with password gate"
```

---

### Task 5.4: Family credit card payment screen `/menu/checkout`

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/checkout/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/FamilyCard.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/PinPad.tsx`

- [ ] **Step 1: Create family card component**

Create `components/FamilyCard.tsx`:

```tsx
'use client';

import { motion } from 'framer-motion';

export default function FamilyCard({ shake = false, holder = 'IVY' }: { shake?: boolean; holder?: string }) {
  return (
    <motion.div
      animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : {}}
      transition={{ duration: 0.4 }}
      className="relative w-full max-w-sm aspect-[1.586/1] rounded-2xl p-5 text-white overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
        boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.5)',
      }}
    >
      <div className="flex justify-between items-start">
        <div className="text-[10px] tracking-[0.3em] opacity-80">HOUSEHOLD CARD</div>
        <div className="w-8 h-5 rounded bg-gradient-to-br from-amber-300 to-amber-500" />
      </div>
      <div className="absolute bottom-5 left-5 right-5">
        <div className="font-mono text-sm tracking-[0.3em] mb-3">•••• •••• •••• ❤️❤️❤️</div>
        <div className="flex justify-between text-[10px] opacity-80">
          <div>持卡人：{holder}</div>
          <div>∞/∞</div>
        </div>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Create pin pad**

Create `components/PinPad.tsx`:

```tsx
'use client';

export default function PinPad({ onKey }: { onKey: (d: string) => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
      {keys.map((k, i) => (
        <button
          key={i}
          disabled={!k}
          onClick={() => k && onKey(k)}
          className={`aspect-[1.5/1] rounded-xl text-xl font-mono ${
            k ? 'bg-zinc-800 active:bg-zinc-700 text-white' : 'opacity-0'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Create checkout page**

Create `app/menu/checkout/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import FamilyCard from '@/components/FamilyCard';
import PinPad from '@/components/PinPad';
import { getDraft, clearDraft, totalPrice } from '@/lib/checkout/draft';

type Phase = 'entering' | 'processing' | 'success' | 'error';

export default function Checkout() {
  const router = useRouter();
  const [draft, setDraft] = useState(() => getDraft());
  const [pin, setPin] = useState('');
  const [phase, setPhase] = useState<Phase>('entering');
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    if (!draft) router.replace('/menu');
  }, [draft, router]);

  const submit = async (password: string) => {
    if (!draft) return;
    setPhase('processing');
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ password, items: draft.items }),
    });
    if (res.status === 401) {
      setErrMsg('密码错误');
      setPhase('error');
      setTimeout(() => { setPhase('entering'); setPin(''); }, 1200);
      return;
    }
    if (!res.ok) {
      setErrMsg('网络出错');
      setPhase('error');
      setTimeout(() => { setPhase('entering'); setPin(''); }, 1500);
      return;
    }
    setPhase('success');
    setTimeout(() => {
      clearDraft();
      router.replace('/menu/orders');
    }, 1400);
  };

  const onKey = (d: string) => {
    if (phase !== 'entering') return;
    if (d === '⌫') return setPin((p) => p.slice(0, -1));
    if (pin.length >= 6) return;
    const next = pin + d;
    setPin(next);
    if (next.length === 6) {
      void submit(next);
    }
  };

  if (!draft) return null;
  const total = totalPrice(draft);

  return (
    <main className="min-h-[100dvh] text-white p-6 flex flex-col"
          style={{ background: 'linear-gradient(180deg, #1a0a2e 0%, #0a1a2e 100%)' }}>
      <div className="text-[10px] tracking-[0.3em] text-zinc-500 text-center">CHECKOUT · ¥ {total}</div>

      <div className="flex-1 flex items-center justify-center my-6">
        <FamilyCard shake={phase === 'error'} />
      </div>

      <div className="mb-6 text-center">
        <div className="text-sm text-white mb-3">
          {phase === 'processing' && '支付中...'}
          {phase === 'success' && (
            <span className="text-green-400">✓ 支付成功</span>
          )}
          {phase === 'error' && <span className="text-red-400">{errMsg}</span>}
          {phase === 'entering' && '输入密码完成支付'}
        </div>
        <div className="flex gap-2 justify-center">
          {[0,1,2,3,4,5].map((i) => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: i < pin.length ? '#a78bfa' : '#1a1a1a',
                scale: phase === 'success' ? 1.3 : 1,
              }}
              className="w-3 h-3 rounded-full border border-zinc-700"
            />
          ))}
        </div>
      </div>

      <div className="mb-6">
        <PinPad onKey={onKey} />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify end-to-end**

1. Click a dish on `/menu` → `/menu/order-single` → "确认下单" → arrives at `/menu/checkout`.
2. Input correct 6-digit password → brief "支付中" → "✓ 支付成功" → redirect to `/menu/orders` (404 for now, next task).
3. Re-try with wrong password → card shakes → "密码错误" → clears pin, returns to input.
4. Check Supabase: `select * from orders` — new row exists.

- [ ] **Step 5: Commit**

```bash
git add app/menu/checkout components/FamilyCard.tsx components/PinPad.tsx
git commit -m "feat(checkout): family credit card payment ritual"
```

---

### Task 5.5: Ivy's order list `/menu/orders`

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/data/orders.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/orders/page.tsx`

- [ ] **Step 1: Create data access**

Create `lib/data/orders.ts`:

```typescript
import { supabaseServer } from '@/lib/supabase/server';
import type { Order, Recipe } from '@/lib/supabase/types';

export interface OrderWithRecipe extends Order {
  recipe: Pick<Recipe, 'id' | 'name' | 'emoji' | 'cover_image_url' | 'short_desc'>;
}

export async function fetchRecentOrders(limit = 50): Promise<OrderWithRecipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('orders')
    .select(`
      *,
      recipe:recipes!orders_main_recipe_id_fkey (id, name, emoji, cover_image_url, short_desc)
    `)
    .order('placed_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderWithRecipe[];
}

export async function fetchOrdersForDate(dateIso: string): Promise<OrderWithRecipe[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from('orders')
    .select(`
      *,
      recipe:recipes!orders_main_recipe_id_fkey (id, name, emoji, cover_image_url, short_desc)
    `)
    .eq('meal_date', dateIso)
    .neq('status', 'cancelled')
    .order('meal_type');
  if (error) throw new Error(error.message);
  return (data ?? []) as OrderWithRecipe[];
}
```

- [ ] **Step 2: Create orders page**

Create `app/menu/orders/page.tsx`:

```tsx
import { fetchRecentOrders } from '@/lib/data/orders';

export const dynamic = 'force-dynamic';

const STATUS: Record<string, { text: string; color: string }> = {
  placed: { text: '已下单', color: 'bg-blue-900/40 text-blue-300' },
  accepted: { text: '已接单', color: 'bg-amber-900/40 text-amber-300' },
  cooking: { text: '正在制作', color: 'bg-rose-900/40 text-rose-300' },
  done: { text: '已完成', color: 'bg-emerald-900/40 text-emerald-300' },
  cancelled: { text: '已取消', color: 'bg-zinc-800 text-zinc-500' },
};

export default async function OrdersPage() {
  const orders = await fetchRecentOrders();

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <h1 className="text-xl font-serif mb-5">我的订单</h1>

      {orders.length === 0 && <div className="text-zinc-500 text-center py-20">还没有订单</div>}

      <ul className="space-y-3">
        {orders.map((o) => {
          const s = STATUS[o.status];
          return (
            <li key={o.id} className="p-3 bg-zinc-900 rounded-2xl flex gap-3">
              <div className="w-16 h-16 rounded-lg bg-zinc-800 flex items-center justify-center text-3xl flex-shrink-0">
                {o.recipe.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{o.recipe.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {o.meal_date} · {o.meal_type === 'breakfast' ? '早餐' : o.meal_type === 'dinner' ? '晚餐' : '周末'} × {o.serving}
                </div>
                <div className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${s.color}`}>{s.text}</div>
              </div>
              <div className="text-pink-400 font-mono text-sm self-center">¥ {o.price_snapshot * o.serving}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

Visit `/menu/orders`. Expected: lists the orders created during payment tests.

- [ ] **Step 4: Commit**

```bash
git add lib/data/orders.ts app/menu/orders
git commit -m "feat(menu): orders list view with status badges"
```

---

## Stage 5b — Kitchen Today View & Order Lifecycle

### Task 5b.1: API route to advance order status

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/api/orders/[id]/advance/route.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/api/order-status.ts`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/lib/api/order-status.test.ts`

- [ ] **Step 1: Write status machine tests**

Create `lib/api/order-status.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { nextStatus, isValidTransition } from './order-status';

describe('order status machine', () => {
  it('advances placed → accepted', () => {
    expect(nextStatus('placed')).toBe('accepted');
  });
  it('advances accepted → cooking', () => {
    expect(nextStatus('accepted')).toBe('cooking');
  });
  it('advances cooking → done', () => {
    expect(nextStatus('cooking')).toBe('done');
  });
  it('no advance from done', () => {
    expect(nextStatus('done')).toBeNull();
  });
  it('no advance from cancelled', () => {
    expect(nextStatus('cancelled')).toBeNull();
  });
  it('validates placed → accepted', () => {
    expect(isValidTransition('placed', 'accepted')).toBe(true);
  });
  it('invalidates placed → cooking (skipping)', () => {
    expect(isValidTransition('placed', 'cooking')).toBe(false);
  });
  it('allows cancel from any non-done', () => {
    expect(isValidTransition('placed', 'cancelled')).toBe(true);
    expect(isValidTransition('cooking', 'cancelled')).toBe(true);
    expect(isValidTransition('done', 'cancelled')).toBe(false);
  });
});
```

- [ ] **Step 2: Fails**

```bash
npm test lib/api/order-status.test.ts
```

- [ ] **Step 3: Implement**

Create `lib/api/order-status.ts`:

```typescript
import type { OrderStatus } from '@/lib/supabase/types';

const CHAIN: Record<OrderStatus, OrderStatus | null> = {
  placed: 'accepted',
  accepted: 'cooking',
  cooking: 'done',
  done: null,
  cancelled: null,
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  return CHAIN[current];
}

export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (to === 'cancelled') return from !== 'done' && from !== 'cancelled';
  return CHAIN[from] === to;
}

export const STATUS_TIMESTAMP_FIELD: Record<OrderStatus, string | null> = {
  placed: 'placed_at',
  accepted: 'accepted_at',
  cooking: 'cooking_at',
  done: 'done_at',
  cancelled: 'cancelled_at',
};
```

- [ ] **Step 4: Tests pass**

```bash
npm test lib/api/order-status.test.ts
```
Expected: `8 passed`.

- [ ] **Step 5: Create advance route**

Create `app/api/orders/[id]/advance/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { nextStatus, isValidTransition, STATUS_TIMESTAMP_FIELD } from '@/lib/api/order-status';
import type { Order, OrderStatus } from '@/lib/supabase/types';

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const target = body?.to as OrderStatus | undefined;

  const sb = supabaseServer();
  const { data: orderData, error: fetchErr } = await sb.from('orders').select('*').eq('id', id).maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!orderData) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const order = orderData as Order;
  const next = target ?? nextStatus(order.status);
  if (!next) return NextResponse.json({ error: 'terminal_state' }, { status: 400 });
  if (!isValidTransition(order.status, next)) {
    return NextResponse.json({ error: `invalid_transition_${order.status}_${next}` }, { status: 400 });
  }

  const now = new Date().toISOString();
  const stampField = STATUS_TIMESTAMP_FIELD[next];
  const updates: Record<string, unknown> = { status: next };
  if (stampField) updates[stampField] = now;

  const { data, error } = await sb.from('orders').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
```

- [ ] **Step 6: Commit**

```bash
git add app/api/orders/[id]/advance lib/api/order-status.ts lib/api/order-status.test.ts
git commit -m "feat(api): order status advance endpoint + state machine"
```

---

### Task 5b.2: Kitchen today view `/kitchen`

**Files:**
- Modify: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/components/kitchen/TodayOrderCard.tsx`

- [ ] **Step 1: Create today order card component**

Create `components/kitchen/TodayOrderCard.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { OrderWithRecipe } from '@/lib/data/orders';
import type { OrderStatus } from '@/lib/supabase/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: '新订单',
  accepted: '已接单',
  cooking: '制作中',
  done: '已完成',
  cancelled: '已取消',
};

const NEXT_CTA: Partial<Record<OrderStatus, string>> = {
  placed: '接单',
  accepted: '开始制作',
  cooking: '出餐',
};

export default function TodayOrderCard({
  order,
  gradient,
  mealLabel,
  mealTime,
}: {
  order: OrderWithRecipe;
  gradient: string;
  mealLabel: string;
  mealTime: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const cta = NEXT_CTA[order.status];

  const advance = async () => {
    if (busy) return;
    setBusy(true);
    const res = await fetch(`/api/orders/${order.id}/advance`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    setBusy(false);
    if (res.ok) router.refresh();
    else alert('推进失败');
  };

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ background: gradient }}>
      <div className="text-[10px] tracking-widest opacity-80 text-white">{mealLabel} · {mealTime}</div>
      <div className="flex gap-3 mt-2 items-center">
        <div className="text-4xl">{order.recipe.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-white">{order.recipe.name}</div>
          <div className="text-xs text-white/80 mt-0.5">× {order.serving} 份 · 预计 — min</div>
        </div>
        {cta ? (
          <button
            onClick={advance}
            disabled={busy}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 text-white font-semibold active:scale-95"
          >
            {cta}
          </button>
        ) : (
          <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/70">
            {STATUS_LABEL[order.status]}
          </span>
        )}
      </div>
      <Link
        href={`/kitchen/recipes/${order.recipe.id}`}
        className="block mt-2 text-[10px] text-white/70 underline"
      >
        查看烹饪步骤 →
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Update kitchen home page**

Overwrite `app/kitchen/page.tsx`:

```tsx
import Link from 'next/link';
import { fetchOrdersForDate } from '@/lib/data/orders';
import TodayOrderCard from '@/components/kitchen/TodayOrderCard';

export const dynamic = 'force-dynamic';

function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default async function KitchenHome() {
  const today = todayIso();
  const orders = await fetchOrdersForDate(today);
  const breakfast = orders.find((o) => o.meal_type === 'breakfast');
  const dinner = orders.find((o) => o.meal_type === 'dinner');
  const weekend = orders.find((o) => o.meal_type === 'weekend');

  return (
    <main className="min-h-[100dvh] bg-black text-white p-5 max-w-lg mx-auto">
      <header className="flex justify-between items-center mb-5">
        <div>
          <div className="text-[10px] text-zinc-500 tracking-widest">KITCHEN</div>
          <h1 className="text-xl font-serif">👨‍🍳 后厨 · {today}</h1>
        </div>
      </header>

      {breakfast && <TodayOrderCard order={breakfast} gradient="linear-gradient(135deg,#f59e0b,#d97706)" mealLabel="今日早餐" mealTime="07:30" />}
      {dinner && <TodayOrderCard order={dinner} gradient="linear-gradient(135deg,#ec4899,#be185d)" mealLabel="今日晚餐" mealTime="19:00" />}
      {weekend && <TodayOrderCard order={weekend} gradient="linear-gradient(135deg,#7c3aed,#5b21b6)" mealLabel="周末特供" mealTime="—" />}

      {orders.length === 0 && (
        <div className="bg-zinc-900 rounded-2xl p-6 text-center text-zinc-500 text-sm">
          今天没有订单
        </div>
      )}

      <nav className="mt-8 grid grid-cols-3 gap-2 text-center text-xs">
        <Link href="/kitchen/recipes" className="bg-zinc-900 py-3 rounded-lg">📖 菜谱</Link>
        <span className="bg-zinc-900/40 py-3 rounded-lg text-zinc-600">📅 本周 (wip)</span>
        <span className="bg-zinc-900/40 py-3 rounded-lg text-zinc-600">🛒 采购 (wip)</span>
      </nav>
    </main>
  );
}
```

- [ ] **Step 3: End-to-end verification**

1. As Ivy: place 1 dinner order via `/menu/order-single?recipe=<奶油蘑菇汤-id>` → pay → success.
2. As chef (manually reset localStorage): visit `/kitchen`. Expected: the dinner order appears as a pink card with "接单" CTA.
3. Click "接单" → page refreshes → button now says "开始制作".
4. Click "开始制作" → button says "出餐".
5. Click "出餐" → status becomes "已完成".
6. As Ivy (reset localStorage to ivy): visit `/menu/orders`. Verify status changes match.

- [ ] **Step 4: Commit**

```bash
git add app/kitchen/page.tsx components/kitchen/TodayOrderCard.tsx
git commit -m "feat(kitchen): today view with order status advance"
```

---

## Stage 6 — Polish, Edge Cases & Phase 1 Wrap-up

### Task 6.1: Add placeholder pages for Phase 2 routes (404 prevention)

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/order-week/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/menu/card/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/week/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/purchase/page.tsx`
- Create: `/Users/gaoyang/Documents/github/ivys-menu/app/kitchen/menu-admin/page.tsx`

- [ ] **Step 1: Create a single placeholder component**

Create `components/Placeholder.tsx`:

```tsx
import Link from 'next/link';

export default function Placeholder({ title, backHref, backLabel }: { title: string; backHref: string; backLabel: string }) {
  return (
    <main className="min-h-[100dvh] bg-black text-white p-6 max-w-lg mx-auto">
      <Link href={backHref} className="text-xs text-zinc-500">← {backLabel}</Link>
      <div className="mt-20 text-center">
        <div className="text-5xl mb-4">🚧</div>
        <h1 className="text-xl font-serif">{title}</h1>
        <p className="text-sm text-zinc-500 mt-2">Phase 2 功能 · 建设中</p>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Create 5 placeholder pages**

```tsx
// app/menu/order-week/page.tsx
import Placeholder from '@/components/Placeholder';
export default function P() { return <Placeholder title="周日批量预订" backHref="/menu" backLabel="回菜单" />; }

// app/menu/card/page.tsx
import Placeholder from '@/components/Placeholder';
export default function P() { return <Placeholder title="家庭信用卡累计" backHref="/menu" backLabel="回菜单" />; }

// app/kitchen/week/page.tsx
import Placeholder from '@/components/Placeholder';
export default function P() { return <Placeholder title="本周订单" backHref="/kitchen" backLabel="回厨房" />; }

// app/kitchen/purchase/page.tsx
import Placeholder from '@/components/Placeholder';
export default function P() { return <Placeholder title="采购清单" backHref="/kitchen" backLabel="回厨房" />; }

// app/kitchen/menu-admin/page.tsx
import Placeholder from '@/components/Placeholder';
export default function P() { return <Placeholder title="菜单管理" backHref="/kitchen" backLabel="回厨房" />; }
```

- [ ] **Step 3: Commit**

```bash
git add components/Placeholder.tsx app/menu/order-week app/menu/card app/kitchen/week app/kitchen/purchase app/kitchen/menu-admin
git commit -m "feat(ui): placeholder pages for Phase 2 routes"
```

---

### Task 6.2: Deploy & manual QA on real devices

**Files:** (none)

- [ ] **Step 1: Deploy to Netlify**

```bash
git push
```

Wait for Netlify build to finish (~2 min).

- [ ] **Step 2: Open deploy URL on Ivy's phone**

1. Open the Netlify URL
2. Pick "🍽️ 我是 Ivy"
3. Add to home screen (Safari iOS / Chrome Android)
4. Verify: icon is pink 🍽️, app launches in standalone mode, title is "Ivy's Menu"
5. Browse menu → order a recipe → pay with correct password → see "支付成功" → see order in list

- [ ] **Step 3: Open deploy URL on chef's phone**

1. Open same URL (different device)
2. Pick "👨‍🍳 我是主厨"
3. Add to home screen
4. Verify: icon is purple 👨‍🍳, title is "后厨"
5. Visit `/kitchen` → see the order placed by Ivy → click "接单" → "开始制作" → "出餐"
6. Verify on Ivy's phone: order status updates (need to pull-to-refresh or reopen — no realtime in Phase 1)

- [ ] **Step 4: Document any issues as GitHub issues**

- [ ] **Step 5: Final commit of any fixes from QA**

```bash
# If any fixes needed
git add <files>
git commit -m "fix(<area>): <issue>"
git push
```

---

### Task 6.3: Write README documenting Phase 1 state

**Files:**
- Create: `/Users/gaoyang/Documents/github/ivys-menu/README.md`

- [ ] **Step 1: Write README**

Create `README.md`:

````markdown
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

所有菜谱录入、采购清单生成等"智能"任务都在 **Claude Code 对话**里完成，而不是通过 app UI。
直接告诉 Claude："加一道菜：XXX"，它会从食谱链接/描述结构化后写入 Supabase。

## 文档

- 产品 spec：`/Users/gaoyang/Documents/github/skill_quest/docs/superpowers/specs/2026-04-21-ivys-menu-product-design.md`
- Phase 1 计划：`/Users/gaoyang/Documents/github/skill_quest/docs/superpowers/plans/2026-04-21-ivys-menu-phase1-mvp.md`
- Phase 2 计划：待 Phase 1 完成后通过 `superpowers:writing-plans` 生成
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README for Phase 1"
git push
```

---

## Self-Review Checklist (run after writing the plan, already done)

Spec coverage against `docs/superpowers/specs/2026-04-21-ivys-menu-product-design.md`:

- [x] Section 1 positioning — captured in header / goal
- [x] Section 2.1 single deploy + dual PWA — Task 2.3
- [x] Section 2.2 no-login role binding — Task 2.1, 2.2, 2.4
- [x] Section 2.3 tech stack — Stage 0
- [x] Section 3.1 recipes schema — Task 1.2
- [x] Section 3.1 orders/order_sides/purchase_lists schema — Task 1.2
- [x] Section 3.2 β side model — order_sides table created; UI wiring is Phase 2 (menu-admin)
- [x] Section 3.3 order lifecycle — Task 5b.1 state machine + Task 5b.2 UI buttons
- [x] Section 4.1 menu pages — /menu done, /menu/orders done, /menu/checkout done; order-week and /menu/card → Phase 2 placeholder
- [x] Section 4.2 kitchen pages — /kitchen done, /kitchen/recipes done; week/purchase/menu-admin → Phase 2 placeholder
- [x] Section 5 payment ritual — Task 5.4 with shake + success animation
- [x] Section 6 weekly pre-order — **Phase 2** (placeholder only)
- [x] Section 7 Claude Code workflow — seed script is proof-of-concept; README documents it
- [x] Section 8 cooking timeline — Task 1.5 + Task 3.3

Placeholder scan:
- No "TBD" / "TODO" / "fill in" strings in task bodies ✓
- All code blocks are complete, runnable ✓
- All imports resolve to either stdlib, installed deps, or files created earlier in plan ✓

Type consistency:
- `MealType`, `RecipeRole`, `OrderStatus` etc. defined once in Task 1.3, used throughout ✓
- `Recipe.steps` typed as `Step[]`, same type used in CookingTimeline ✓
- `CreateOrdersInput` in Task 5.3 matches draft shape in Task 5.1 ✓

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-04-21-ivys-menu-phase1-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration. Pair with `superpowers:subagent-driven-development`.

2. **Inline Execution** — run tasks in this session with checkpoints. Pair with `superpowers:executing-plans`.

Since this plan targets a **new repository** that doesn't exist yet, the first real step (Task 0.1) creates the directory. Both execution modes should be told to **treat `/Users/gaoyang/Documents/github/ivys-menu/` as the working directory once Task 0.1 completes**. Commits and terminal commands thereafter target the new repo.

**Phase 2** (weekly batch pre-order + menu-admin + purchase list + card stats) should get its own plan via `superpowers:writing-plans` once Phase 1 is live and validated on real devices.

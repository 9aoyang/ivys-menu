-- Ivy's Menu — initial schema (Phase 1)
--
-- Tables:
--   recipes         — full catalog of dishes
--   orders          — each meal ordered by Ivy
--   order_sides     — chef's side-dish assignments for dinner orders
--   purchase_lists  — weekly shopping list, generated via Claude Code conversation
--
-- Views:
--   card_stats      — family credit card cumulative stats (Stage 5 /menu/card)

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

create table order_sides (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references orders(id) on delete cascade,
  side_recipe_id      uuid not null references recipes(id),
  assigned_at         timestamptz not null default now(),
  unique (order_id, side_recipe_id)
);

create table purchase_lists (
  id                  uuid primary key default gen_random_uuid(),
  week_start          date not null unique,
  items               jsonb not null default '[]'::jsonb,
  generated_at        timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

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

create view card_stats as
  select
    count(*)::int         as total_orders,
    coalesce(sum(price_snapshot), 0)::int as total_spent,
    min(paid_at)          as first_paid_at,
    max(paid_at)          as last_paid_at
  from orders
  where status != 'cancelled';

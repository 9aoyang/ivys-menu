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

export interface PurchaseListItem {
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface PurchaseList {
  id: string;
  week_start: string;
  items: PurchaseListItem[];
  generated_at: string;
  updated_at: string;
}

export interface CardStats {
  total_orders: number;
  total_spent: number;
  first_paid_at: string | null;
  last_paid_at: string | null;
}

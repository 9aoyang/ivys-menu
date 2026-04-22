import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '.env.local') });

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

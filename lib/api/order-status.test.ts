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
  it('allows cancel from any non-done/cancelled', () => {
    expect(isValidTransition('placed', 'cancelled')).toBe(true);
    expect(isValidTransition('accepted', 'cancelled')).toBe(true);
    expect(isValidTransition('cooking', 'cancelled')).toBe(true);
    expect(isValidTransition('done', 'cancelled')).toBe(false);
    expect(isValidTransition('cancelled', 'cancelled')).toBe(false);
  });
});

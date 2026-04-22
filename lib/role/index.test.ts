import { describe, it, expect, beforeEach } from 'vitest';
import { getRole, setRole, clearRole } from './index';

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

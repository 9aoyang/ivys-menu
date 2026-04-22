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
